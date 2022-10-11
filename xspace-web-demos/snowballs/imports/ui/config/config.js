import './config.css';
import './config.html';

import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../api/rooms.js';
import { RoomScans } from '../../api/roomScans';
import { Players } from "../../api/players.js";
import { Alignment } from "../../api/alignment.js";
import { SystemState } from "../../api/systemState.js";

import * as THREE from '../../lib/three/three.module.js';
import { GLTFLoader } from '../../lib/three/GLTFLoader.js';
import { OBJLoader } from '../../lib/three/OBJLoader.js';
import { OrbitControls } from "../../lib/three/OrbitControls.js";
import { TransformControls } from "../../lib/three/TransformControls.js";
import { SliceGeometry } from "../../lib/three/slice.js";
import { BufferGeometryUtils } from "../../lib/three/BufferGeometryUtils.js";

// Canvas and Renderer 
var canvas, renderer; 

// Views
var viewBuild = {
    viewport: null, 
    scene: null,
    camera: null,
    roomA: new THREE.Mesh(),
    roomB: new THREE.Mesh(),
    orbitControl: null,
    transformControl: null,
    transformables: [],
    intersectBoundaries: {
        defined: false, 
        start: new THREE.Vector3(),
        end: new THREE.Vector3(),
        boundaries: []
    },
    shared: {
        defined: false, 
        start: new THREE.Vector3(),
        end: new THREE.Vector3()
    }
}
var viewA = {
    viewport: null,
    scene: null,
    camera: null,
    room: new THREE.Mesh(),
    orbitControl: null,
    shared: null
}
var viewB = {
    viewport: null,
    scene: null, 
    camera: null,
    room: new THREE.Mesh(),
    orbitControl: null,
    shared: null
}

// Avatars 
var avatars = []; 

// Conditions for allowing scene
var conditions = {
    numPlayers: 0,
    playerAmesh: false,
    playerBmesh: false
}

// Camera set-up parameters
var camWorldParams = {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: new THREE.Vector3(0.0, 5.0, 5.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
};

// Controls
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersectBtn; 
var clearIntersectBtn;
var shareIntersectBtn;
var clearSharedBtn; 

// Instantiating a camera object 
function newCamera(params, view) {
    let bounds = view.getBoundingClientRect();
    let camera = new THREE.PerspectiveCamera(
        params.fov,
        bounds.width / bounds.height,
        params.near,
        params.far
    );
    camera.position.copy(params.position);
    camera.lookAt(params.lookAt);
    return camera;
}

// Lighting
function lightScene(scene) {
    // Ambient
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    // Directional
    let dir_light = new THREE.DirectionalLight(0x9fc5e8, 0.7);
    dir_light.position.set(50, 200, 100);
    dir_light.position.multiplyScalar(1.0);
    scene.add(dir_light);

    let dir_light_2 = new THREE.DirectionalLight(0xa2c4c9, 0.7);
    dir_light_2.position.set(-200, 50, -100);
    dir_light_2.position.multiplyScalar(1.0);
    scene.add(dir_light_2);

    let dir_light_3 = new THREE.DirectionalLight(0x9cc98a, 0.7); // 0xa7cf97
    dir_light_3.position.set(100, -35, -50);
    dir_light_3.position.multiplyScalar(1.0);
    scene.add(dir_light_3);

    let dir_light_4 = new THREE.DirectionalLight(0x666666, 0.4);
    dir_light_4.position.set(0, -200, 0);
    dir_light_4.position.multiplyScalar(1.0);
    scene.add(dir_light_4);

    // Hemisphere
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.4);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 4, 0);
    scene.add(hemiLight);
}
function lightScenes() {
    lightScene(viewBuild.scene);
    lightScene(viewA.scene);
    lightScene(viewB.scene);
}

// Loading GLTF models 
var loadModelGLTF = function(source, color) {
    return new Promise(function (resolve) {
        let material = new THREE.MeshLambertMaterial({
            flatShading: true,
            side: THREE.DoubleSide, // THREE.BackSide
            color: color,
            opacity: 0.75,
            transparent: true
        });

        let loader = new GLTFLoader();

        loader.load(source, function (gltf) {
            let bufferGeometry = gltf.scenes[0].children[0].geometry;
            let geometry = new THREE.Geometry();
            geometry.fromBufferGeometry(bufferGeometry);
            let mesh = new THREE.Mesh(geometry, material);

            // "Center" Mesh
            mesh.geometry.computeBoundingBox();
            let bbCenter = new THREE.Vector3();
            mesh.geometry.boundingBox.getCenter(bbCenter);
            let bbSize = new THREE.Vector3();
            mesh.geometry.boundingBox.getSize(bbSize);
            let xOffset = -bbCenter.x;
            let yOffset = -bbCenter.y + 0.5 * bbSize.y;
            let zOffset = -bbCenter.z;
            mesh.geometry.translate(xOffset, yOffset, zOffset);
            mesh.updateMatrix();
            mesh.updateMatrixWorld();

            resolve(mesh);
        });
    });
}

// Load room GLTF models 
function loadRooms() {
    Promise.all([
        loadModelGLTF("roomA.gltf", 0xcfe2f3),
        loadModelGLTF("roomB.gltf", 0xffe599)
    ]).then(values => {
        let roomAMesh = values[0];
        let roomBMesh = values[1];

        // View: Build 
        viewBuild.roomA.geometry = roomAMesh.geometry.clone();
        viewBuild.roomA.material = roomAMesh.material.clone();
        viewBuild.roomB.geometry = roomBMesh.geometry.clone();
        viewBuild.roomB.material = roomBMesh.material.clone();

        // View: A
        viewA.room.geometry = roomAMesh.geometry.clone();
        viewA.room.material = roomAMesh.material.clone();

        // View: B
        viewB.room.geometry = roomBMesh.geometry.clone();
        viewB.room.material = roomBMesh.material.clone();

        // Shared 
        if (viewBuild.shared.defined == true) {
            shareIntersection(viewBuild.shared.start, viewBuild.shared.end);
        }

        render();
    });
}

// Load room GLTF models 
function loadRoom(id) { // "A" or "B"
    let color = (id == "A") ? 0xcfe2f3 : 0xffe599;    
    Promise.all([
        loadModelGLTF("room" + id + ".gltf", color)
    ]).then(values => {
        let mesh = values[0];

        if (id == "A") {
            // View: Build 
            viewBuild.roomA.geometry = mesh.geometry.clone();
            viewBuild.roomA.material = mesh.material.clone();

            // View: A
            viewA.room.geometry = mesh.geometry.clone();
            viewA.room.material = mesh.material.clone();
        }
        else {
            // View: Build 
            viewBuild.roomB.geometry = mesh.geometry.clone();
            viewBuild.roomB.material = mesh.material.clone();

            // View: B
            viewB.room.geometry = mesh.geometry.clone();
            viewB.room.material = mesh.material.clone();
        }

        // Shared 
        if (viewBuild.shared.defined == true) {
            shareIntersection(viewBuild.shared.start, viewBuild.shared.end);
        }

        render();
    });
}

function addScanGeometry(docId, newDoc) {
    // require( '/public/libs/threejs/OBJLoader.js' );

    // convert newDoc.objString to the JSON type
    let manager = new THREE.LoadingManager();
    var objLoader = new OBJLoader( manager );
    var content = objLoader.parse( newDoc.objString ).toJSON();
    // load the JSON object to a scene object
    var loader = new THREE.ObjectLoader();
    var object = loader.parse( content );
    object.docId = docId;
    //object.type = newDoc.type;

    // set the position, rotation, scale
    object.position.x = newDoc.position[0];
    object.position.y = newDoc.position[1];
    object.position.z = newDoc.position[2];

    // Need to use YXZ ordering-- conversion from extrinsic to extrinsic euler angles
    object.rotation.set(newDoc.rotation[0], newDoc.rotation[1], newDoc.rotation[2], 'YXZ');

    object.scale.x = newDoc.scale[0];
    object.scale.y = newDoc.scale[1];
    object.scale.z = newDoc.scale[2];

    // We use BackSide material to avoid having to reverse all mesh normals and
    // triangle vertex order on the hololens.
    let newMaterial = new THREE.MeshLambertMaterial({
     flatShading: true,
     side: THREE.BackSide,
     color: 0xB2B2B2
    });

    let children = []
    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        child.material = newMaterial;
        children.push( child );
      }
    });

    // TODO -- save in a spot where we can merge later?

    if (newDoc.id == "A") {
        viewA.room.add(object);
    }
    else {
        viewB.room.add(object);
    }
}

// Rendering
function renderView(scene, camera, view) {
    let {
        left,
        right,
        top,
        bottom,
        width,
        height
    } = view.getBoundingClientRect();
    let positiveYUpBottom = renderer.domElement.offsetHeight - bottom;
    renderer.setViewport(left, positiveYUpBottom, width, height);
    renderer.setScissor(left, positiveYUpBottom, width, height);
    renderer.setScissorTest(true);
    renderer.render(scene, camera);
}
function render() {
    renderView(viewA.scene, viewA.camera, viewA.viewport);
    renderView(viewB.scene, viewB.camera, viewB.viewport);
    renderView(viewBuild.scene, viewBuild.camera, viewBuild.viewport);
}

// For instantiating character avatars 
function newAvatar(color) {
    var avatar = new THREE.Object3D();
    // Meshes
    var avatarHeadMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.25, 0.25),
        new THREE.MeshLambertMaterial({ color: color })
    );
    var avatarEyeLeft = new THREE.Mesh(
        new THREE.CircleBufferGeometry(0.05, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    avatarEyeLeft.position.set(-0.075, 0, 0.13);
    var avatarEyeRight = new THREE.Mesh(
        new THREE.CircleBufferGeometry(0.05, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    avatarEyeRight.position.set(0.075, 0, 0.13);
    var avatarPupilLeft = new THREE.Mesh(
        new THREE.CircleBufferGeometry(0.025, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    avatarPupilLeft.position.set(-0.075, 0, 0.135);
    var avatarPupilRight = new THREE.Mesh(
        new THREE.CircleBufferGeometry(0.025, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    avatarPupilRight.position.set(0.075, 0, 0.135);
    avatarHeadMesh.attach(avatarEyeLeft);
    avatarHeadMesh.attach(avatarEyeRight);
    avatarHeadMesh.attach(avatarPupilLeft);
    avatarHeadMesh.attach(avatarPupilRight);
    avatar.attach(avatarHeadMesh);
    var avatarBodyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.5, 0.25),
        new THREE.MeshLambertMaterial({ color: color })
    );
    avatarBodyMesh.position.set(0.0, -0.5, 0.0);
    avatar.attach(avatarBodyMesh);

    return {
        avatar: avatar,
        body: avatarBodyMesh,
        head: avatarHeadMesh
    };
}

// Setting up the canvas, renderer, viewports, cameras, scenes, lighting, and rooms
function initThree() {
    // Canvas & Renderer
    canvas = document.getElementById("c");
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    // Views
    viewA.viewport = document.getElementById("viewA");
    viewB.viewport = document.getElementById("viewB");
    viewBuild.viewport = document.getElementById("viewBuilder");

    // Scenes
    viewA.scene = new THREE.Scene();
    viewA.scene.background = new THREE.Color(0xdedede);
    viewB.scene = new THREE.Scene();
    viewB.scene.background = new THREE.Color(0xdedede);
    viewBuild.scene = new THREE.Scene();
    viewBuild.scene.background = new THREE.Color(0xdedede);

    // Lighting
    lightScenes();

    // Cameras 
    viewA.camera = newCamera(camWorldParams, viewA.viewport);
    viewA.scene.add(viewA.camera);
    viewB.camera = newCamera(camWorldParams, viewB.viewport);
    viewB.scene.add(viewB.camera);
    viewBuild.camera = newCamera(camWorldParams, viewBuild.viewport);
    viewBuild.scene.add(viewBuild.camera);

    // Import room meshes
    viewBuild.scene.add(viewBuild.roomA);
    viewBuild.scene.add(viewBuild.roomB);
    viewBuild.transformables.push(viewBuild.roomA);
    viewBuild.transformables.push(viewBuild.roomB);
    viewA.scene.add(viewA.room);
    viewB.scene.add(viewB.room);

    //loadRooms();

    render();
}

// Function for attaching transforms
function attachTransform(event, view) {
    let {
        left,
        right,
        top,
        bottom,
        width,
        height
    } = view.viewport.getBoundingClientRect();
    mouse.x = ((event.clientX - left) / width) * 2 - 1;
    mouse.y = -(((event.clientY - top) / height) * 2 - 1);
    raycaster.setFromCamera(mouse, view.camera);

    let intersects = raycaster.intersectObjects(view.transformables, true);
    if (intersects.length > 0) {
        view.transformControl.attach(intersects[0].object);
    } else {
        view.transformControl.detach();
    }
    render();
}
// Toggling tranform modes
function toggleTransform(event, view) {
    switch (event.keyCode) {
        case 84: // T
            view.transformControl.setMode("translate");
            render();
            break;
        case 82: // R
            view.transformControl.setMode("rotate");
            render();
            break;
        case 69: // E
            view.transformControl.setMode("scale");
            render();
            break;
        case 27: // Esc
            view.transformControl.detach();
            render();
            break;
    }
}

// Handling transform controller changes 
function handleViewBuildTransformChange() {
    let currObj = viewBuild.transformControl.object; 
    if (currObj == viewBuild.roomA || currObj == viewBuild.roomB) {
        let id = (currObj == viewBuild.roomA) ? "A" : "B";
        let _id = Rooms.findOne({ id: id })._id;
        switch (viewBuild.transformControl.mode) {
            case "translate":
                let newPos = [];
                viewBuild["room" + id].position.toArray(newPos);
                Meteor.call('room.move', _id, newPos);
                break;
            case "rotate":
                let newRot = [];
                viewBuild["room" + id].quaternion.toArray(newRot);
                Meteor.call('room.rotate', _id, newRot);
                break;
            case "scale":
                let newScale = [];
                viewBuild["room" + id].scale.toArray(newScale);
                Meteor.call('room.scale', _id, newScale);
                break; 
        }
    }
    render();
}

// Intersecting the ground plane 
function intersectGround(view) {
    let {
        left,
        right,
        top,
        bottom,
        width,
        height
    } = view.viewport.getBoundingClientRect();
    mouse.x = ((event.clientX - left) / width) * 2 - 1;
    mouse.y = -(((event.clientY - top) / height) * 2 - 1);
    raycaster.setFromCamera(mouse, view.camera);
    return raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0.0, 1.0, 0.0), 0.0));
}

// Update hide boundaries
function updateBoundaries(boundaries, start, end) {
    let bl = start;
    let tr = end;
    let br = new THREE.Vector3(tr.x, 0.0, bl.z);
    let tl = new THREE.Vector3(bl.x, 0.0, tr.z);
    updateBoundary(boundaries[0], bl, br);
    updateBoundary(boundaries[1], br, tr);
    updateBoundary(boundaries[2], tr, tl);
    updateBoundary(boundaries[3], tl, bl);
}
function updateBoundary(boundary, pointA, pointB) {
    let vecAB = new THREE.Vector3().copy(pointB).sub(pointA);
    vecAB.y = 0;
    let rot = -Math.atan2(vecAB.z, vecAB.x);
    let pos = new THREE.Vector3()
        .copy(vecAB)
        .multiplyScalar(0.5)
        .add(pointA);
    let len = vecAB.length();
    boundary.position.x = pos.x;
    boundary.position.z = pos.z;
    boundary.scale.x = len;
    boundary.rotation.y = rot;

    render();
}

// Defining boundaries
function initBoundaries() {
    let boundaries = [];
    let numBounds = 4;
    let boundary;
    for (let i = 0; i < numBounds; i++) {
        boundary = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 2.0, 0.1),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
        );
        boundary.position.y = 1.0;
        boundary.visible = false;
        boundaries.push(boundary);
    }
    return boundaries;
}

// Setting boundaries visible 
function setBoundariesVisible(boundaries, visible) {
    for (let i = 0; i < boundaries.length; i++) {
        boundaries[i].visible = visible;
    }
}

// Functions for setting intersection boundaries 
function setIntersectStart() {
    viewBuild.intersectBoundaries.start = intersectGround(viewBuild);
    viewBuild.intersectBoundaries.end = intersectGround(viewBuild);
    updateBoundaries(
        viewBuild.intersectBoundaries.boundaries,
        viewBuild.intersectBoundaries.start,
        viewBuild.intersectBoundaries.end
    );
    setBoundariesVisible(viewBuild.intersectBoundaries.boundaries, true);
    viewBuild.viewport.addEventListener("mousemove", settingIntersectEnd);
}
function settingIntersectEnd() {
    viewBuild.viewport.removeEventListener("click", setIntersectStart);
    viewBuild.viewport.addEventListener("click", setIntersectEnd);
    viewBuild.intersectBoundaries.end = intersectGround(viewBuild);
    updateBoundaries(
        viewBuild.intersectBoundaries.boundaries,
        viewBuild.intersectBoundaries.start,
        viewBuild.intersectBoundaries.end
    );
}
function setIntersectEnd() {
    viewBuild.viewport.removeEventListener("mousemove", settingIntersectEnd);
    viewBuild.viewport.removeEventListener("click", setIntersectEnd);
    let intersectBoundariesStart = [];
    let intersectBoundariesEnd = [];
    viewBuild.intersectBoundaries.start.toArray(intersectBoundariesStart);
    viewBuild.intersectBoundaries.end.toArray(intersectBoundariesEnd);
    Meteor.call("alignment.setIntersection", intersectBoundariesStart, intersectBoundariesEnd);
}

// Functions for sharing intersection area
function shareIntersection(start, end) {
    let minX = Math.min(start.x, end.x);
    let minZ = Math.min(start.z, end.z);
    let maxX = Math.max(start.x, end.x);
    let maxZ = Math.max(start.z, end.z);
    let min = new THREE.Vector3(minX, 0.0, minZ);
    let max = new THREE.Vector3(maxX, 0.0, maxZ);


    let frontInv = new THREE.Plane(new THREE.Vector3(0.0, 0.0, 1.0)).translate(min);
    let backInv = new THREE.Plane(new THREE.Vector3(0.0, 0.0, -1.0)).translate(max);
    let leftInv = new THREE.Plane(new THREE.Vector3(1.0, 0.0, 0.0)).translate(min);
    let rightInv = new THREE.Plane(new THREE.Vector3(-1.0, 0.0, 0.0)).translate(max);

    // Get shared regions
    // from room A  
    let sharedA = viewBuild.roomA.geometry.clone();
    let APositionOffset = viewBuild.roomA.position.clone();
    let ARotationOffset = viewBuild.roomA.rotation.clone();
    sharedA.translate(APositionOffset.x, APositionOffset.y, APositionOffset.z);
    sharedA.rotateX(ARotationOffset.x);
    sharedA.rotateY(ARotationOffset.y);
    sharedA.rotateZ(ARotationOffset.z);

    console.log(sharedA);
    console.log(viewBuild.roomB);

    sharedA = SliceGeometry(sharedA, frontInv, false);
    sharedA = SliceGeometry(sharedA, backInv, false);
    sharedA = SliceGeometry(sharedA, leftInv, false);
    sharedA = SliceGeometry(sharedA, rightInv, false);
    sharedA.translate(-APositionOffset.x, -APositionOffset.y, -APositionOffset.z);
    sharedA.rotateX(-ARotationOffset.x);
    sharedA.rotateY(-ARotationOffset.y);
    sharedA.rotateZ(-ARotationOffset.z);
    // from room B 
    let sharedB = viewBuild.roomB.geometry.clone();
    let BPositionOffset = viewBuild.roomB.position.clone();
    let BRotationOffset = viewBuild.roomB.rotation.clone();
    sharedB.translate(BPositionOffset.x, BPositionOffset.y, BPositionOffset.z);
    sharedB.rotateX(BRotationOffset.x);
    sharedB.rotateY(BRotationOffset.y);
    sharedB.rotateZ(BRotationOffset.z);
    sharedB = SliceGeometry(sharedB, frontInv, false);
    sharedB = SliceGeometry(sharedB, backInv, false);
    sharedB = SliceGeometry(sharedB, leftInv, false);
    sharedB = SliceGeometry(sharedB, rightInv, false);
    sharedB.translate(-BPositionOffset.x, -BPositionOffset.y, -BPositionOffset.z);
    sharedB.rotateX(-BRotationOffset.x);
    sharedB.rotateY(-BRotationOffset.y);
    sharedB.rotateZ(-BRotationOffset.z);

    // Placement in remote environments
    let roomBPos = viewBuild.roomB.position.clone();
    let roomAPos = viewBuild.roomA.position.clone();
    let roomBRot = viewBuild.roomB.quaternion.clone();
    let roomARot = viewBuild.roomA.quaternion.clone();
    let BInARelativePosition = new THREE.Vector3().subVectors(roomBPos, roomAPos);
    let AInBRelativePosition = new THREE.Vector3().subVectors(roomAPos, roomBPos);
    let BinARelativeQuaterion = new THREE.Quaternion().multiplyQuaternions(roomBRot, roomARot.clone().inverse());
    let AinBRelativeQuaterion = new THREE.Quaternion().multiplyQuaternions(roomARot, roomBRot.clone().inverse());
    let sharedAMesh = new THREE.Mesh(sharedA, viewBuild.roomA.material.clone());
    let sharedBMesh = new THREE.Mesh(sharedB, viewBuild.roomB.material.clone());
    sharedAMesh.position.copy(AInBRelativePosition);
    sharedAMesh.quaternion.copy(AinBRelativeQuaterion);
    sharedBMesh.position.copy(BInARelativePosition);
    sharedBMesh.quaternion.copy(BinARelativeQuaterion);
    viewA.scene.add(sharedBMesh);
    viewA.shared = sharedBMesh;
    viewB.scene.add(sharedAMesh);
    viewB.shared = sharedAMesh;

    console.log("A");
    console.log(roomAPos);
    console.log(roomARot);
    console.log("B");
    console.log(roomBPos);
    console.log(roomBRot);
    console.log("shared");
    console.log(start);
    console.log(end);

    render();
}

// Clearing shared regions 
function clearShared() {
    if (viewA.shared != null) {
        viewA.scene.remove(viewA.shared);
        viewA.shared = null;
    }
    if (viewB.shared != null) {
        viewB.scene.remove(viewB.shared);
        viewB.shared = null;
    }
}

function resetDBs() {
    Meteor.call("systemState.deleteAll");
    Meteor.call("systemState.init");

    Meteor.call("alignment.reset");
    Meteor.call("rooms.reset");
    Meteor.call("roomScans.deleteAll");
    Meteor.call("projectiles.deleteAll");
    Meteor.call("players.deleteAll");
}

// Initialize controls 
function initControls() {
    // View: Build 
    // Orbit 
    viewBuild.orbitControl = new OrbitControls(viewBuild.camera, viewBuild.viewport);
    viewBuild.orbitControl.update();
    viewBuild.orbitControl.addEventListener("change", render);
    // Transform 
    viewBuild.transformControl = new TransformControls(viewBuild.camera, viewBuild.viewport);
    viewBuild.transformControl.addEventListener("change", handleViewBuildTransformChange);
    viewBuild.transformControl.addEventListener("dragging-changed", function (event) {
        viewBuild.orbitControl.enabled = !event.value;
    });
    viewBuild.scene.add(viewBuild.transformControl);
    var attachTransformViewBuild = function (event) {
        attachTransform(event, viewBuild);
    };
    viewBuild.viewport.addEventListener(
        "dblclick",
        attachTransformViewBuild,
        false
    );
    var toggleTransformViewBuild = function (event) {
        toggleTransform(event, viewBuild);
    };
    viewBuild.viewport.addEventListener(
        "keydown",
        toggleTransformViewBuild,
        false
    );

    // View: A 
    // Orbit 
    viewA.orbitControl = new OrbitControls(viewA.camera, viewA.viewport);
    viewA.orbitControl.update();
    viewA.orbitControl.addEventListener("change", render);

    // View: B
    // Orbit 
    viewB.orbitControl = new OrbitControls(viewB.camera, viewB.viewport);
    viewB.orbitControl.update();
    viewB.orbitControl.addEventListener("change", render);

    // Defining intersection 
    viewBuild.intersectBoundaries.boundaries = initBoundaries();
    for (let i = 0; i < viewBuild.intersectBoundaries.boundaries.length; i++) {
        viewBuild.scene.add(viewBuild.intersectBoundaries.boundaries[i]);
    }
    intersectBtn = document.getElementById("defineIntersection");
    intersectBtn.addEventListener("click", function (event) {
        setBoundariesVisible(viewBuild.intersectBoundaries.boundaries, false);
        viewBuild.viewport.addEventListener("click", setIntersectStart);
        render();
    });
    clearIntersectBtn = document.getElementById("clearIntersection");
    clearIntersectBtn.addEventListener("click", function (event) {
        Meteor.call("alignment.clearIntersection");
    });
    shareIntersectBtn = document.getElementById("shareIntersection");
    shareIntersectBtn.addEventListener("click", function (event) {
        let intersectBoundariesStart = [];
        let intersectBoundariesEnd = [];
        viewBuild.intersectBoundaries.start.toArray(intersectBoundariesStart);
        viewBuild.intersectBoundaries.end.toArray(intersectBoundariesEnd);
        Meteor.call("alignment.updateShared", intersectBoundariesStart, intersectBoundariesEnd);
    });
    clearSharedBtn = document.getElementById("clearShared");
    clearSharedBtn.addEventListener("click", function (event) {
        Meteor.call("alignment.clearShared");
    });

}

// Check system state functions:
function checkConditions() {
    console.log(conditions);
    if (conditions.numPlayers < 2) {
        document.getElementById("waitingMessage").innerHTML = "Waiting for 1 player to join..."
        return false;
    }
    if (!conditions.playerAmesh || !conditions.playerBmesh) { // if one of them is not loaded:
        document.getElementById("waitingMessage").innerHTML = "Waiting for mesh scans to import..."
        return false;
    }
    conditionsMet();
    return true;
}
function conditionsMet() {
    console.log("Conditions met!");

    intersectBtn.style.display = "inline-block";
    clearIntersectBtn.style.display = "inline-block";
    shareIntersectBtn.style.display = "inline-block";
    clearSharedBtn.style.display = "inline-block";
    document.getElementById("waitingMessage").style.display = "none";
}

// input mesh name, output mesh with merged buffer geometry
function mergeMesh(parent, color) {
    let newMaterial = new THREE.MeshLambertMaterial({
      flatShading: true,
      side: THREE.BackSide,
      color: color
    });

    let geometries = [];
    console.log(parent.children.length);
    for (let i = 0; i < parent.children.length; i++) {
        let child = parent.children[i];
        console.log(child);
        geometries.push(child.children[0].geometry);
        //parent.remove(child);
    }

    let mergedBuffGeom = BufferGeometryUtils.mergeBufferGeometries(geometries)
    let mergedGeom = new THREE.Geometry().fromBufferGeometry( mergedBuffGeom );

    let mergedObject = new THREE.Mesh(
      mergedGeom,
      newMaterial
    );
    //parent = mergedObject;

    let compositeMaterial = new THREE.MeshLambertMaterial({
        flatShading: true,
        side: THREE.BackSide, // THREE.BackSide
        color: color,
        opacity: 0.75,
        transparent: true
    });
    let compositeObj = new THREE.Mesh(
        mergedGeom,
        compositeMaterial
    );
    viewBuild.roomA = compositeObj;
    viewBuild.scene.add(viewBuild.roomA);
    viewBuild.transformables.push(viewBuild.roomA);
    
    return mergedObject;
}

function meshImportDone(id) {
    console.log("mesh import done");

    // TODO: consolidate into a single mesh?
    // for every child of viewA.room
    mergeMesh(viewA.room);


    console.log(id);
    console.log(conditions.playerAmesh);

    // Set conditions:
    conditions.playerAmesh = (id == "A") ? true : conditions.playerAmesh;
    conditions.playerBmesh = (id == "B") ? true : conditions.playerBmesh;

    console.log(conditions.playerAmesh);

    // Check conditions
    checkConditions();
}

// Synchronize with server collections
// Subscriptions
function sync() {
    // System State 
    Meteor.subscribe("systemState");
    let statetUpdates = SystemState.find({});

    // Alignment 
    Meteor.subscribe("alignment");
    let alignmentUpdates = Alignment.find({});
    alignmentUpdates.observeChanges({
        added: function (docId, newDoc) {
            // Handle intersection boundaries 
            if (newDoc.intersection == true) {
                viewBuild.intersectBoundaries.defined = true; 
                viewBuild.intersectBoundaries.start.fromArray(newDoc.intersectionStart);
                viewBuild.intersectBoundaries.end.fromArray(newDoc.intersectionEnd);
                setBoundariesVisible(viewBuild.intersectBoundaries.boundaries, true);
                updateBoundaries(
                    viewBuild.intersectBoundaries.boundaries,
                    viewBuild.intersectBoundaries.start,
                    viewBuild.intersectBoundaries.end
                );
            }
            // Handle shared 
            if (newDoc.shared == true) {
                viewBuild.shared.defined = true; 
                viewBuild.shared.start.fromArray(newDoc.sharedStart);
                viewBuild.shared.end.fromArray(newDoc.sharedEnd);
            }
        }, 
        changed: function (docId, newDoc) {
            // Handling intersection boundaries
            if ("intersection" in newDoc) {
                if (newDoc.intersection == false) {
                    setBoundariesVisible(viewBuild.intersectBoundaries.boundaries, false);
                    viewBuild.intersectBoundaries.defined = false; 
                    render();
                }
                if (newDoc.intersection == true) {
                    viewBuild.intersectBoundaries.defined = true; 
                }
            }
            if (("intersectionEnd" in newDoc) && ("intersectionStart" in newDoc)) {
                if (viewBuild.intersectBoundaries.defined == true) {
                    viewBuild.intersectBoundaries.start.fromArray(newDoc.intersectionStart);
                    viewBuild.intersectBoundaries.end.fromArray(newDoc.intersectionEnd);
                    setBoundariesVisible(viewBuild.intersectBoundaries.boundaries, true);
                    updateBoundaries(
                        viewBuild.intersectBoundaries.boundaries,
                        viewBuild.intersectBoundaries.start,
                        viewBuild.intersectBoundaries.end
                    );
                }
            }
            if ("shared" in newDoc) {
                if (newDoc.shared == false) {
                    console.log("deleting");
                    viewBuild.shared.defined = false;
                    clearShared();
                    render();
                }
                if (newDoc.shared == true) {
                    viewBuild.shared.defined = true; 
                }
            }
            if (("sharedStart" in newDoc) && ("sharedEnd" in newDoc)) {
                if (viewBuild.shared.defined == true) {
                    viewBuild.shared.start.fromArray(newDoc.sharedStart);
                    viewBuild.shared.end.fromArray(newDoc.sharedEnd);
                    shareIntersection(viewBuild.shared.start, viewBuild.shared.end);
                }
            }
        }
    });

    // Rooms 
    Meteor.subscribe("roomA");
    let roomAUpdates = Rooms.find({ id: "A" });
    roomAUpdates.observeChanges({
        added: function (docId, newDoc) {
            viewBuild.roomA.position.fromArray(newDoc.position);
            viewBuild.roomA.quaternion.fromArray(newDoc.rotation);
            viewBuild.roomA.scale.fromArray(newDoc.scale);

            // Check if scan was already completed/ saved in DB:
            if (newDoc.done) {
                meshImportDone(newDoc.id);
            }
            
            render();
        },
        changed: function (docId, update) {
            // Check if scan complete:
            if (update.done) {
                console.log(update);
                meshImportDone("A");
            }

            if (viewBuild.transformControl.object == null) {
                let p = update.position;
                if (p) {
                    viewBuild.roomA.position.fromArray(p);
                }
                let r = update.quaternion;
                if (r) {
                    viewBuild.roomA.quaternion.fromArray(r);
                }
                let s = update.scale;
                if (s) {
                    viewBuild.roomA.scale.fromArray(s);
                }
            }
            render();
        }
    });

    Meteor.subscribe("roomB");
    let roomBUpdates = Rooms.find({ id: "B" });
    roomBUpdates.observeChanges({
        added: function (docId, newDoc) {
            viewBuild.roomB.position.fromArray(newDoc.position);
            viewBuild.roomB.quaternion.fromArray(newDoc.rotation);
            viewBuild.roomB.scale.fromArray(newDoc.scale);
            render();
        },
        changed: function (id, update) {
            // Check if scan complete:
            if (update.done) {
                meshImportDone("B");
            }

            if (viewBuild.transformControl.object == null) {
                let p = update.position;
                if (p) {
                    viewBuild.roomB.position.fromArray(p);
                }
                let r = update.quaternion;
                if (r) {
                    viewBuild.roomB.quaternion.fromArray(r);
                }
                let s = update.scale;
                if (s) {
                    viewBuild.roomB.scale.fromArray(s);
                }
            }
            render();
        }
    });

    Meteor.subscribe("roomScans");
    let scanUpdates = RoomScans.find({});
    scanUpdates.observeChanges({
        added: function (docId, newDoc) {
            addScanGeometry(docId, newDoc);
        },
        changed: function (docId, newDoc) {}
    });

    // Players 
    function addNameTag(object, name) {
        console.log(name);

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext("2d");
        canvas.height = 128;
        canvas.width = 128;
        // canvas.background-color = #ff0000;
        ctx.font ="30px Arial";
        var lineheight = 30;
        var lines = name.split('\n');
        for (var i = 0; i<lines.length; i++)
          ctx.fillText(lines[i], 15, 30 + (i*lineheight));
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true; //just to make sure it's all up to date.
        var meshMaterial = new THREE.MeshPhongMaterial( {
          map: texture,
          opacity: 0.7,
          color: 0xaa0000,
          side:THREE.DoubleSide
        } );

        object.material = meshMaterial;
    }

    Meteor.subscribe("players");
    let playersUpdates = Players.find({});
    playersUpdates.observeChanges({
        added: function (docId, newDoc) {
            // add to our player count to check later
            conditions.numPlayers += 1; 
            
            // if the player is not a HL user, load the room mesh:
            if (!newDoc.isHL) {

                // Load mesh
                loadRoom(newDoc.worldId);

                // Set conditions or keep them the same, depending
                conditions.playerAmesh = (newDoc.worldId == "A") ? true : conditions.playerAmesh;
                conditions.playerBmesh = (newDoc.worldId == "B") ? true : conditions.playerBmesh;
            }

            // Check conditions:
            checkConditions();

            // Display avatar
            let newAvatarColor = newDoc.color;
            let avatar = newAvatar(newAvatarColor);
            if (newDoc.worldId == "A") {
                viewA.scene.add(avatar.avatar);
            } else {
                viewB.scene.add(avatar.avatar);
            }
            avatar.avatar.position.fromArray(newDoc.position);

            if (!newDoc.isHL) {
                avatar.head.quaternion.fromArray(newDoc.rotation); 
            }
            else {
                let r = newDoc.rotation;
                avatar.head.rotation.set(r[0], r[1], r[2], 'YXZ'); // TODO: are these coordinates correct?
                // TODO: They won't be if the space itself is rotated!
            }

            avatar["scene"] = newDoc.worldId;
            avatar["collectionId"] = docId;
            avatars.push(avatar);
            console.log(avatar);
            render();
        },
        changed: function (docId, newDoc) {
            let updateAvatar = avatars.filter(function (avatar) {
                return avatar.collectionId == docId;
            });
            
            console.log(updateAvatar);

            if (updateAvatar.length > 0) {
                let p = newDoc.position;
                if (p) {
                    updateAvatar[0].avatar.position.fromArray(p);
                }
                let r = newDoc.rotation;
                if (r) {
                    if (r.length == 3) {
                        updateAvatar[0].head.rotation.set(r[0], r[1], r[2], 'YXZ');
                    }
                    else {
                        updateAvatar[0].head.quaternion.fromArray(r);
                    }
                }
                let name = newDoc.name;
                if (name) {
                    addNameTag(updateAvatar[0].body, name);
                }

                render();
            }
            
        }
    });
}

window.onload = function () {
    resetDBs(); // FOR DEBUGGING: Reset DB's on page refresh
    initThree();
    initControls(); 
    sync();
    
}