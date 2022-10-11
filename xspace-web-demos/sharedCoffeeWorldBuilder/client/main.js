import './main.html';
import * as THREE from './three/three.module.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { OrbitControls } from "./three/OrbitControls.js";
import { TransformControls } from "./three/TransformControls.js";
import { SliceGeometry } from "./three/slice.js";
import { Rooms } from '../imports/api/rooms.js';
import { Intersections } from '../imports/api/intersections.js';

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
        shared: false, 
        start: new THREE.Vector3(),
        end: new THREE.Vector3(),
        boundaries: []
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

// Mappings between spaces 
var mappings = {
    AB: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    BA: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    BuildA: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    BuildB: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    ABuild: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    BBuild: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    }
}

// Camera set-up parameters
var camWorldParams = {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: new THREE.Vector3(0.0, 5.0, 5.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
};

// Control variables
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
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
var loadModelGLTF = function (source, color) {
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

        // Load shared 
        if (viewBuild.intersectBoundaries.shared == true && viewA.shared == null && viewB.shared == null) {
            shareIntersection();
        }

        render();
    });
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

/*
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
*/

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
    loadRooms();

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
    Meteor.call("intersections.set", intersectBoundariesStart, intersectBoundariesEnd);
}

function defineMapping() {
    // AB
    // Position
    mappings.ABuild.positionMap.identity();
    mappings.ABuild.positionMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(viewBuild.roomA.quaternion));
    mappings.ABuild.positionMap.premultiply(new THREE.Matrix4().makeScale(viewBuild.roomA.scale.x, 1.0, viewBuild.roomA.scale.z));
    mappings.ABuild.positionMap.premultiply(new THREE.Matrix4().makeTranslation(viewBuild.roomA.position.x, 0.0, viewBuild.roomA.position.z));
    mappings.BuildB.positionMap.identity();
    mappings.BuildB.positionMap.premultiply(new THREE.Matrix4().makeTranslation(-viewBuild.roomB.position.x, 0.0, -viewBuild.roomB.position.z));
    mappings.BuildB.positionMap.premultiply(new THREE.Matrix4().makeScale(1.0 / viewBuild.roomB.scale.x, 1.0, 1.0 / viewBuild.roomB.scale.z));
    mappings.BuildB.positionMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(viewBuild.roomB.quaternion.clone().inverse()));
    mappings.AB.positionMap.identity();
    mappings.AB.positionMap.premultiply(mappings.ABuild.positionMap);
    mappings.AB.positionMap.premultiply(mappings.BuildB.positionMap);
    // Rotation
    mappings.ABuild.rotationMap.identity();
    mappings.ABuild.rotationMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(viewBuild.roomA.quaternion));
    mappings.BuildB.rotationMap.identity();
    mappings.BuildB.rotationMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(viewBuild.roomB.quaternion.clone().inverse()));
    mappings.AB.rotationMap.identity();
    mappings.AB.rotationMap.premultiply(mappings.ABuild.rotationMap);
    mappings.AB.rotationMap.premultiply(mappings.BuildB.rotationMap);
    // Scale 
    mappings.ABuild.scaleMap.identity();
    mappings.ABuild.scaleMap.premultiply(new THREE.Matrix4().makeScale(viewBuild.roomA.scale.x, 1.0, viewBuild.roomA.scale.z));
    mappings.BuildB.scaleMap.identity();
    mappings.BuildB.scaleMap.premultiply(new THREE.Matrix4().makeScale(1.0 / viewBuild.roomB.scale.x, 1.0, 1.0 / viewBuild.roomB.scale.z));
    mappings.AB.scaleMap.identity();
    mappings.AB.scaleMap.premultiply(new THREE.Matrix4().makeScale(viewBuild.roomA.scale.x / viewBuild.roomB.scale.x, 1.0, viewBuild.roomA.scale.z / viewBuild.roomB.scale.z));

    // BA
    // Position
    mappings.BBuild.positionMap.identity();
    mappings.BBuild.positionMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(viewBuild.roomB.quaternion));
    mappings.BBuild.positionMap.premultiply(new THREE.Matrix4().makeScale(viewBuild.roomB.scale.x, 1.0, viewBuild.roomB.scale.z));
    mappings.BBuild.positionMap.premultiply(new THREE.Matrix4().makeTranslation(viewBuild.roomB.position.x, 0.0, viewBuild.roomB.position.z));
    mappings.BuildA.positionMap.identity();
    mappings.BuildA.positionMap.premultiply(new THREE.Matrix4().makeTranslation(-viewBuild.roomA.position.x, 0.0, -viewBuild.roomA.position.z));
    mappings.BuildA.positionMap.premultiply(new THREE.Matrix4().makeScale(1.0 / viewBuild.roomA.scale.x, 1.0, 1.0 / viewBuild.roomA.scale.z));
    mappings.BuildA.positionMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(viewBuild.roomA.quaternion.clone().inverse()));
    mappings.BA.positionMap.identity();
    mappings.BA.positionMap.premultiply(mappings.BBuild.positionMap);
    mappings.BA.positionMap.premultiply(mappings.BuildA.positionMap);
    // Rotation
    mappings.BBuild.rotationMap.identity();
    mappings.BBuild.rotationMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(viewBuild.roomB.quaternion));
    mappings.BuildA.rotationMap.identity();
    mappings.BuildA.rotationMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(viewBuild.roomA.quaternion.clone().inverse()));
    mappings.BA.rotationMap.identity();
    mappings.BA.rotationMap.premultiply(mappings.BBuild.rotationMap);
    mappings.BA.rotationMap.premultiply(mappings.BuildA.rotationMap);
    // Scale 
    mappings.BBuild.scaleMap.identity();
    mappings.BBuild.scaleMap.premultiply(new THREE.Matrix4().makeScale(viewBuild.roomB.scale.x, 1.0, viewBuild.roomB.scale.z));
    mappings.BuildA.scaleMap.identity();
    mappings.BuildA.scaleMap.premultiply(new THREE.Matrix4().makeScale(1.0 / viewBuild.roomA.scale.x, 1.0, 1.0 / viewBuild.roomA.scale.z));
    mappings.BA.scaleMap.identity();
    mappings.BA.scaleMap.premultiply(new THREE.Matrix4().makeScale(viewBuild.roomB.scale.x / viewBuild.roomA.scale.x, 1.0, viewBuild.roomB.scale.z / viewBuild.roomB.scale.z));
}

// Extracting intersection geometry
function extractIntersection(room, bl, tr, br, tl) {
    var blbr = new THREE.Plane(new THREE.Vector3().subVectors(tl, bl)).translate(bl);
    var bltl = new THREE.Plane(new THREE.Vector3().subVectors(br, bl)).translate(bl);
    var trbr = new THREE.Plane(new THREE.Vector3().subVectors(tl, tr)).translate(tr);
    var trtl = new THREE.Plane(new THREE.Vector3().subVectors(br, tr)).translate(tr);

    let intersectGeometry = room.geometry.clone();
    intersectGeometry = SliceGeometry(intersectGeometry, blbr);
    intersectGeometry = SliceGeometry(intersectGeometry, bltl);
    intersectGeometry = SliceGeometry(intersectGeometry, trbr);
    intersectGeometry = SliceGeometry(intersectGeometry, trtl);
    let intersectMaterial = new THREE.MeshLambertMaterial({ flatShading: true, color: 0xffffff, side: THREE.DoubleSide, transparent: true });
    let intersection = new THREE.Mesh(intersectGeometry, intersectMaterial);

    return intersection;
}


// Share intersection 
function shareIntersection() {
    defineMapping();

    // Calculate shared regions
    var startBuild = viewBuild.intersectBoundaries.start.clone();
    var endBuild = viewBuild.intersectBoundaries.end.clone();
    var blBuild = new THREE.Vector3(Math.min(startBuild.x, endBuild.x), 0.0, Math.min(startBuild.z, endBuild.z));
    var trBuild = new THREE.Vector3(Math.max(startBuild.x, endBuild.x), 0.0, Math.max(startBuild.z, endBuild.z));
    var brBuild = new THREE.Vector3(Math.max(startBuild.x, endBuild.x), 0.0, Math.min(startBuild.z, endBuild.z));
    var tlBuild = new THREE.Vector3(Math.min(startBuild.x, endBuild.x), 0.0, Math.max(startBuild.z, endBuild.z));

    var blA = new THREE.Vector3().copy(blBuild).applyMatrix4(mappings.BuildA.positionMap);
    var trA = new THREE.Vector3().copy(trBuild).applyMatrix4(mappings.BuildA.positionMap);
    var brA = new THREE.Vector3().copy(brBuild).applyMatrix4(mappings.BuildA.positionMap);
    var tlA = new THREE.Vector3().copy(tlBuild).applyMatrix4(mappings.BuildA.positionMap);

    var blB = new THREE.Vector3().copy(blBuild).applyMatrix4(mappings.BuildB.positionMap);
    var trB = new THREE.Vector3().copy(trBuild).applyMatrix4(mappings.BuildB.positionMap);
    var brB = new THREE.Vector3().copy(brBuild).applyMatrix4(mappings.BuildB.positionMap);
    var tlB = new THREE.Vector3().copy(tlBuild).applyMatrix4(mappings.BuildB.positionMap);
    
    let intersectionA = extractIntersection(viewA.room, blA, trA, brA, tlA);
    intersectionA.material = viewA.room.material.clone();
    intersectionA.material.opacity = 0.375;

    let intersectionB = extractIntersection(viewB.room, blB, trB, brB, tlB);
    intersectionB.material = viewB.room.material.clone();
    intersectionB.material.opacity = 0.375;

    intersectionA.position.applyMatrix4(mappings.AB.positionMap);
    intersectionA.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(mappings.AB.rotationMap));
    intersectionA.scale.applyMatrix4(mappings.AB.scaleMap);
    viewB.scene.add(intersectionA);
    viewB.shared = intersectionA;

    intersectionB.position.applyMatrix4(mappings.BA.positionMap);
    intersectionB.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(mappings.BA.rotationMap));
    intersectionB.scale.applyMatrix4(mappings.BA.scaleMap);
    viewA.scene.add(intersectionB);
    viewA.shared = intersectionB;
    
    render();
}

// Clearing shared regions 
function clearSharedIntersection() {
    if (viewA.shared != null) {
        viewA.scene.remove(viewA.shared);
        viewA.shared = null;
    }
    if (viewB.shared != null) {
        viewB.scene.remove(viewB.shared);
        viewB.shared = null;
    }
    render();
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
        Meteor.call("intersections.clear");
    });
    shareIntersectBtn = document.getElementById("shareIntersection");
    shareIntersectBtn.addEventListener("click", function (event) {
        let intersectBoundariesStart = [];
        let intersectBoundariesEnd = [];
        viewBuild.intersectBoundaries.start.toArray(intersectBoundariesStart);
        viewBuild.intersectBoundaries.end.toArray(intersectBoundariesEnd);
        Meteor.call("intersections.share");
    });
    clearSharedBtn = document.getElementById("clearShared");
    clearSharedBtn.addEventListener("click", function (event) {
        console.log("Clear shared");
        Meteor.call("intersections.clearShare");
    });
}

// Synchronize with server collections
// Subscriptions
function sync() {
    Meteor.call("intersections.clear");

    // Intersections
    Meteor.subscribe("intersections");
    let intersectionsUpdates = Intersections.find({});
    intersectionsUpdates.observeChanges({
        added: function (docId, newDoc) {
            if (newDoc.defined) {
                viewBuild.intersectBoundaries.defined = true;
                viewBuild.intersectBoundaries.start.fromArray(newDoc.start);
                viewBuild.intersectBoundaries.end.fromArray(newDoc.end);
                updateBoundaries(
                    viewBuild.intersectBoundaries.boundaries,
                    viewBuild.intersectBoundaries.start,
                    viewBuild.intersectBoundaries.end
                );
                setBoundariesVisible(viewBuild.intersectBoundaries.boundaries, true);
                render();
            }
            if (newDoc.shared) {
                viewBuild.intersectBoundaries.shared = true; 
                if (viewA.room != null && viewB.room != null) {
                    shareIntersection();
                }
            }
        },
        changed: function (docId, newDoc) {
            console.log(newDoc);
            if ("defined" in newDoc) {
                if (newDoc.defined) {
                    viewBuild.intersectBoundaries.defined = true;
                    viewBuild.intersectBoundaries.start.fromArray(newDoc.start);
                    viewBuild.intersectBoundaries.end.fromArray(newDoc.end);
                    updateBoundaries(
                        viewBuild.intersectBoundaries.boundaries,
                        viewBuild.intersectBoundaries.start,
                        viewBuild.intersectBoundaries.end
                    );
                    setBoundariesVisible(viewBuild.intersectBoundaries.boundaries, true);
                } else {
                    viewBuild.intersectBoundaries.defined = false;
                    setBoundariesVisible(viewBuild.intersectBoundaries.boundaries, false);
                }
                render();
            }
            if ("shared" in newDoc) {
                viewBuild.intersectBoundaries.shared = newDoc.shared; 
                if (newDoc.shared) {
                    shareIntersection();
                } else {
                    clearSharedIntersection();
                }
            }
        }
    })
    /*
    intersectionsUpdates.observeChanges({
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
    */

    // Rooms 
    Meteor.subscribe("roomA");
    let roomAUpdates = Rooms.find({ id: "A" });
    roomAUpdates.observeChanges({
        added: function (docId, newDoc) {
            viewBuild.roomA.position.fromArray(newDoc.position);
            viewBuild.roomA.quaternion.fromArray(newDoc.quaternion);
            viewBuild.roomA.scale.fromArray(newDoc.scale);
            render();
        },
        changed: function (id, update) {
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
            viewBuild.roomB.quaternion.fromArray(newDoc.quaternion);
            viewBuild.roomB.scale.fromArray(newDoc.scale);
            render();
        },
        changed: function (id, update) {
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

    /*
    // Players 
    Meteor.subscribe("players");
    let playersUpdates = Players.find({});
    playersUpdates.observeChanges({
        added: function (docId, newDoc) {
            let newAvatarColor = (newDoc.worldId == "A") ? 0x0000ff : 0xffff00;
            let avatar = newAvatar(newAvatarColor);
            if (newDoc.worldId == "A") {
                viewA.scene.add(avatar.avatar);
            } else {
                viewB.scene.add(avatar.avatar);
            }
            avatar.avatar.position.fromArray(newDoc.position);
            avatar.head.quaternion.fromArray(newDoc.headQuaternion);
            avatar["scene"] = newDoc.worldId;
            avatar["collectionId"] = docId;
            avatars.push(avatar);
            render();
        },
        changed: function (docId, newDoc) {
            let updateAvatar = avatars.filter(function (avatar) {
                return avatar.collectionId == docId;
            });

            if (updateAvatar.length > 0) {
                let p = newDoc.position;
                if (p) {
                    updateAvatar[0].avatar.position.fromArray(p);
                }
                let r = newDoc.headQuaternion;
                if (r) {
                    updateAvatar[0].head.quaternion.fromArray(r);
                }
                render();
            }

        }
    });
    */
}

window.onload = function () {
    initThree();
    initControls();
    sync();
}