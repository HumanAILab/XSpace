import "./main.html";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { Random } from "meteor/random";
import * as THREE from "./three/three.module.js";
import { GLTFLoader } from './three/GLTFLoader.js';
import { PointerLockControls } from "./three/PointerLockControls.js";
import { SliceGeometry } from "./three/slice";

// World Server URL 
const URL = "http://localhost:8000/";
var WorldServer;
var clientId = Random.id(); 
// Canvas and Renderer
var canvas, renderer; 

// Views 
var view = {
    viewport: null,
    scene: null,
    camera: null,
    room: {
        mesh: new THREE.Mesh(),
        position: null,
        quaternion: null,
        scale: null,
        loaded: false
    }, 
    remoteRoom: {
        mesh: new THREE.Mesh(),
        position: null,
        quaternion: null,
        scale: null,
        loaded: false 
    },
    pointerLock: null,
    movement: {
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false
    },
    avatar: {
        avatar: null,
        body: null,
        head: null
    },
    avatarPrevState: {
        position: new THREE.Vector3(),
        headRotation: new THREE.Euler()
    },
    shared: {
        mesh: null, 
        start: null,
        end: null,
        loaded: false 
    },
    remoteUsers: []
}

// Mappings between rooms 
var mappings = {
    localRemote: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    remoteLocal: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    localComposite: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    remoteComposite: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    compositeLocal: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    },
    compositeRemote: {
        positionMap: new THREE.Matrix4(),
        rotationMap: new THREE.Matrix4(),
        scaleMap: new THREE.Matrix4()
    }
}

// Camera set-up parameters
var camFirstParams = {
    fov: 60,
    near: 0.1,
    far: 100,
    position: new THREE.Vector3(0.0, 1.5, 0.0),
    lookAt: new THREE.Vector3(0.0, 1.5, -1.0)
};

// Identify world
var worldId;
FlowRouter.route("/:id", {
    name: "worldId.select",
    action(params, queryParams) {
        worldId = params.id;
    }
})

// Rooms 
var roomA, roomB; 

// MongoDB Collections synced with the server 
var Intersections; 
var Rooms; 
var Users; 

// Update variables
var prevTime = performance.now();

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

// New avatar 
function newAvatar(color) {
    var avatar = new THREE.Object3D();
    // Meshes
    var head = new THREE.Mesh(
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
    head.attach(avatarEyeLeft);
    head.attach(avatarEyeRight);
    head.attach(avatarPupilLeft);
    head.attach(avatarPupilRight);
    avatar.attach(head);
    var body = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.5, 0.25),
        new THREE.MeshLambertMaterial({ color: color })
    );
    body.position.set(0.0, -0.5, 0.0);
    avatar.attach(body);

    // SHARED COFFEE
    var mug = newMug();
    avatar.attach(mug);
    mug.position.set(-0.30, -0.4, -0.30);

    return {
        avatar: avatar,
        body: body,
        head: head,
        mug: mug
    };
}

// New mug (SHARED COFFEE)
function newMug() {
    // Cup geometry
    var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.675, 2.0, 32), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    var handle = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.125, 16, 100, Math.PI * 2), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    var mug = new THREE.Object3D()
    cup.position.set(0.0, 0.0, 0.0);
    handle.position.set(0, 0.125, 0.75);
    handle.rotation.set(0.0, Math.PI / 2.0, 0.0);
    mug.add(cup);
    mug.add(handle);
    mug.scale.set(0.1, 0.1, 0.1);

    return mug; 
}

// Loading room GLTF models 
var loadModelGLTF = function (source, color) {
    return new Promise(function (resolve) {
        let material = new THREE.MeshLambertMaterial({
            flatShading: true,
            side: THREE.DoubleSide, // THREE.BackSide
            color: color,
            opacity: 1.0,
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
    renderView(view.scene, view.camera, view.viewport);
}

// Three.js setup 
function initThree() {
    // Canvas & Renderer
    canvas = document.getElementById("c");
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    // Views
    view.viewport = document.getElementById("viewFirst");

    // Scenes
    view.scene = new THREE.Scene();
    view.scene.background = new THREE.Color(0xdedede);

    // Lighting 
    lightScene(view.scene);

    // Room
    view.scene.add(view.room.mesh);
    Promise.all([
        loadModelGLTF("../roomA.gltf", 0xcfe2f3),
        loadModelGLTF("../roomB.gltf", 0xffe599)
    ]).then(result => {
        roomA = result[0];
        roomB = result[1];
        if (worldId == "A") {
            view.room.mesh.geometry = roomA.geometry.clone();
            view.room.mesh.material = roomA.material.clone();
            view.remoteRoom.mesh.geometry = roomB.geometry.clone();
            view.remoteRoom.mesh.material = roomB.material.clone();
        } else {
            view.room.mesh.geometry = roomB.geometry.clone();
            view.room.mesh.material = roomB.material.clone();
            view.remoteRoom.mesh.geometry = roomA.geometry.clone();
            view.remoteRoom.mesh.material = roomA.material.clone();
        }

        loadIntersection();

        render();
    });

    // Cameras 
    view.camera = newCamera(camFirstParams, view.viewport);
    view.scene.add(view.camera);

    // User Avatar
    let userAvatarColor = (worldId == "A") ? 0x0000ff : 0xffff00;
    view.avatar = newAvatar(userAvatarColor);
    view.scene.add(view.avatar.avatar);
    view.avatarPrevState.position.copy(view.avatar.avatar.position);
    view.avatarPrevState.headRotation.copy(view.avatar.head.rotation);

    // Render 
    render();
}

// Character movement controls 
function wasdDown(event) {
    switch (event.keyCode) {
        case 87: // W
            view.movement.moveForward = true;
            break;

        case 65: // A
            view.movement.moveLeft = true;
            break;

        case 83: // S
            view.movement.moveBackward = true;
            break;

        case 68: // D
            view.movement.moveRight = true;
            break;
    }
}
function wasdUp(event) {
    switch (event.keyCode) {
        case 87: // W
            view.movement.moveForward = false;
            break;

        case 65: // A
            view.movement.moveLeft = false;
            break;

        case 83: // S
            view.movement.moveBackward = false;
            break;

        case 68: // D
            view.movement.moveRight = false;
            break;
    }
}

// Initialize controls 
function initControls() {
    // PointerLock Controls 
    view.pointerLock = new PointerLockControls(
        view.camera,
        view.viewport
    );
    view.pointerLock.addEventListener("change", render);
    view.viewport.addEventListener("click", function (event) {
        if (view.pointerLock.isLocked != true) {
            view.pointerLock.lock();
            document.addEventListener("keydown", wasdDown);
            document.addEventListener("keyup", wasdUp);
        }
    });
    view.pointerLock.addEventListener("unlock", function (event) {
        document.removeEventListener("keydown", wasdDown);
        document.removeEventListener("keyup", wasdUp);
    });
}

// User Movements
function userMove(delta) {
    view.movement.velocity.x -=
        view.movement.velocity.x * 10.0 * delta;
    view.movement.velocity.z -=
        view.movement.velocity.z * 10.0 * delta;
    view.movement.direction.z =
        Number(view.movement.moveForward) -
        Number(view.movement.moveBackward);
    view.movement.direction.x =
        Number(view.movement.moveRight) -
        Number(view.movement.moveLeft);
    view.movement.direction.normalize();
    if (view.movement.moveForward || view.movement.moveBackward)
        view.movement.velocity.z -=
            view.movement.direction.z * 50.0 * delta;
    if (view.movement.moveLeft || view.movement.moveRight)
        view.movement.velocity.x -=
            view.movement.direction.x * 50.0 * delta;
    view.pointerLock.moveRight(-view.movement.velocity.x * delta);
    view.pointerLock.moveForward(-view.movement.velocity.z * delta);
}

// Handling User Avatar Updates 
function updateAvatar() {
    if (view.avatar.avatar != null) {
        // Position
        view.avatar.avatar.position.copy(view.camera.position);
    }

    if (view.avatar.head != null) {
        // Head orientation
        let dir = new THREE.Vector3();
        view.pointerLock.getDirection(dir);
        let mx = new THREE.Matrix4().lookAt(
            dir,
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0)
        );
        view.avatar.head.setRotationFromMatrix(mx);

        // SHARED COFFEE
        let mugPos = new THREE.Vector3(0.3, 0.0, 0.3).applyMatrix4(mx);
        mugPos.y = -0.5;
        let mugRotMx = new THREE.Matrix4().lookAt(
            new THREE.Vector3(-dir.x, 0.0, -dir.z),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0)
        );
        view.avatar.mug.position.copy(mugPos);
        view.avatar.mug.setRotationFromMatrix(mugRotMx);
    }
}

// Synchronize avatar with server 
function syncAvatar() {
    if (WorldServer.status().connected) {
        let rotDiff = new THREE.Quaternion()
            .setFromEuler(view.avatarPrevState.headRotation)
            .angleTo(view.avatar.head.quaternion);
        let moveDiff = view.avatarPrevState.position.distanceTo(view.avatar.avatar.position);
        if ((moveDiff > 0.1) || (rotDiff > 0.10)) {
            let pos = [];
            let rot = [];
            view.avatar.avatar.position.toArray(pos);
            view.avatar.head.rotation.toArray(rot);
            WorldServer.call("users.update", clientId, pos, rot);
            view.avatarPrevState.position.copy(view.avatar.avatar.position);
            view.avatarPrevState.headRotation.copy(view.avatar.head.rotation);
        }
    }
}

// Check remote avatar visibility 
function checkShareRemote(position) {
    position.applyMatrix4(mappings.localComposite.positionMap);
    return (position.x >= Math.min(view.shared.start.x, view.shared.end.x) &&
        position.x <= Math.max(view.shared.start.x, view.shared.end.x) &&
        position.z >= Math.min(view.shared.start.z, view.shared.end.z) &&
        position.z <= Math.max(view.shared.start.z, view.shared.end.z));
}

function defineMapping() {
    // local to remote 
    // position
    mappings.localComposite.positionMap.identity();
    mappings.localComposite.positionMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(view.room.quaternion));
    mappings.localComposite.positionMap.premultiply(new THREE.Matrix4().makeScale(view.room.scale.x, 1.0, view.room.scale.z));
    mappings.localComposite.positionMap.premultiply(new THREE.Matrix4().makeTranslation(view.room.position.x, 0.0, view.room.position.z));
    mappings.compositeRemote.positionMap.identity();
    mappings.compositeRemote.positionMap.premultiply(new THREE.Matrix4().makeTranslation(-view.remoteRoom.position.x, 0.0, -view.remoteRoom.position.z));
    mappings.compositeRemote.positionMap.premultiply(new THREE.Matrix4().makeScale(1.0 / view.remoteRoom.scale.x, 1.0, 1.0 / view.remoteRoom.scale.z));
    mappings.compositeRemote.positionMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(view.remoteRoom.quaternion.clone().inverse()));
    mappings.localRemote.positionMap.identity();
    mappings.localRemote.positionMap.premultiply(mappings.localComposite.positionMap);
    mappings.localRemote.positionMap.premultiply(mappings.compositeRemote.positionMap);
    // rotation 
    mappings.localComposite.rotationMap.identity();
    mappings.localComposite.rotationMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(view.room.quaternion));
    mappings.compositeRemote.rotationMap.identity();
    mappings.compositeRemote.rotationMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(view.remoteRoom.quaternion.clone().inverse()));
    mappings.localRemote.rotationMap.premultiply(mappings.localComposite.rotationMap);
    mappings.localRemote.rotationMap.premultiply(mappings.compositeRemote.rotationMap);
    // scale
    mappings.localComposite.scaleMap.identity();
    mappings.localComposite.scaleMap.premultiply(new THREE.Matrix4().makeScale(view.room.scale.x, 1.0, view.room.scale.z));
    mappings.compositeRemote.scaleMap.identity();
    mappings.compositeRemote.scaleMap.premultiply(new THREE.Matrix4().makeScale(1.0 / view.remoteRoom.scale.x, 1.0, 1.0 / view.remoteRoom.scale.z));
    mappings.localRemote.scaleMap.identity();
    mappings.localRemote.scaleMap.premultiply(new THREE.Matrix4().makeScale(view.room.scale.x / view.remoteRoom.scale.x, 1.0, view.room.scale.z / view.remoteRoom.scale.z));

    // Remote to local
    // position
    mappings.remoteComposite.positionMap.identity();
    mappings.remoteComposite.positionMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(view.remoteRoom.quaternion));
    mappings.remoteComposite.positionMap.premultiply(new THREE.Matrix4().makeScale(view.remoteRoom.scale.x, 1.0, view.remoteRoom.scale.z));
    mappings.remoteComposite.positionMap.premultiply(new THREE.Matrix4().makeTranslation(view.remoteRoom.position.x, 0.0, view.remoteRoom.position.z));
    mappings.compositeLocal.positionMap.identity(); 
    mappings.compositeLocal.positionMap.premultiply(new THREE.Matrix4().makeTranslation(-view.room.position.x, 0.0, -view.room.position.z));
    mappings.compositeLocal.positionMap.premultiply(new THREE.Matrix4().makeScale(1.0 / view.room.scale.x, 1.0, 1.0 / view.room.scale.z));
    mappings.compositeLocal.positionMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(view.room.quaternion.clone().inverse()));
    mappings.remoteLocal.positionMap.identity();
    mappings.remoteLocal.positionMap.premultiply(mappings.remoteComposite.positionMap);
    mappings.remoteLocal.positionMap.premultiply(mappings.compositeLocal.positionMap);
    // rotation
    mappings.remoteComposite.rotationMap.identity();
    mappings.remoteComposite.rotationMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(view.remoteRoom.quaternion));
    mappings.compositeLocal.rotationMap.identity();
    mappings.compositeLocal.rotationMap.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(view.room.quaternion.clone().inverse()));
    mappings.remoteLocal.rotationMap.premultiply(mappings.remoteComposite.rotationMap);
    mappings.remoteLocal.rotationMap.premultiply(mappings.compositeLocal.rotationMap);
    // scale
    mappings.remoteComposite.scaleMap.identity();
    mappings.remoteComposite.scaleMap.premultiply(new THREE.Matrix4().makeScale(view.remoteRoom.scale.x, 1.0, view.remoteRoom.scale.z));
    mappings.compositeLocal.scaleMap.identity();
    mappings.compositeLocal.scaleMap.premultiply(new THREE.Matrix4().makeScale(1.0 / view.room.scale.x, 1.0, 1.0 / view.room.scale.z));
    mappings.remoteLocal.scaleMap.identity();
    mappings.remoteLocal.scaleMap.premultiply(new THREE.Matrix4().makeScale(view.remoteRoom.scale.x / view.room.scale.x, 1.0, view.remoteRoom.scale.z / view.room.scale.z));
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

// Loading intersection
function loadIntersection() {
    if (view.room.loaded &&
        view.room.mesh != null &&
        view.remoteRoom.mesh != null && 
        view.remoteRoom.loaded &&
        view.shared.loaded) {
        defineMapping();

        // Calculate shared region 
        var blComposite = new THREE.Vector3(Math.min(view.shared.start.x, view.shared.end.x), 0.0, Math.min(view.shared.start.z, view.shared.end.z));
        var trComposite = new THREE.Vector3(Math.max(view.shared.start.x, view.shared.end.x), 0.0, Math.max(view.shared.start.z, view.shared.end.z));
        var brComposite = new THREE.Vector3(Math.max(view.shared.start.x, view.shared.end.x), 0.0, Math.min(view.shared.start.z, view.shared.end.z));
        var tlComposite = new THREE.Vector3(Math.min(view.shared.start.x, view.shared.end.x), 0.0, Math.max(view.shared.start.z, view.shared.end.z));

        var blRemote = new THREE.Vector3().copy(blComposite).applyMatrix4(mappings.compositeRemote.positionMap);
        var trRemote = new THREE.Vector3().copy(trComposite).applyMatrix4(mappings.compositeRemote.positionMap);
        var brRemote = new THREE.Vector3().copy(brComposite).applyMatrix4(mappings.compositeRemote.positionMap);
        var tlRemote = new THREE.Vector3().copy(tlComposite).applyMatrix4(mappings.compositeRemote.positionMap);

        // Get intersection
        var intersection = extractIntersection(view.remoteRoom.mesh, blRemote, trRemote, brRemote, tlRemote);
        intersection.material = view.remoteRoom.mesh.material.clone();
        intersection.renderOrder = 1;
        intersection.material.opacity = 0.375;

        // Place intersection 
        intersection.position.applyMatrix4(mappings.remoteLocal.positionMap);
        intersection.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(mappings.remoteLocal.rotationMap));
        intersection.scale.applyMatrix4(mappings.remoteLocal.scaleMap);
        view.scene.add(intersection);
        view.shared.mesh = intersection;

        render();
    }
}

// Update Loop 
function update() {
    requestAnimationFrame(update);

    let time = performance.now();
    let delta = (time - prevTime) / 1000;

    // Update User 
    userMove(delta);
    updateAvatar();
    syncAvatar();

    render();
    prevTime = time;
}

// Synchronize with Server 
function sync() {
    WorldServer = DDP.connect(URL);

    let remoteWorldId = (worldId == "A") ? "B" : "A";

    

    // Intersections 
    Intersections = new Mongo.Collection("intersections", { connection: WorldServer });
    WorldServer.subscribe("intersections");
    let intersectionsUpdates = Intersections.find({});
    intersectionsUpdates.observeChanges({
        added: function (docId, newDoc) {
            view.shared.start = new THREE.Vector3().fromArray(newDoc.start);
            view.shared.end = new THREE.Vector3().fromArray(newDoc.end);
            view.shared.loaded = true;
            loadIntersection()
        }
    });

    // Rooms
    Rooms = new Mongo.Collection("rooms", { connection: WorldServer });
    WorldServer.subscribe("intersections");
    let localRoomUpdates = Rooms.find({ id: worldId });
    localRoomUpdates.observeChanges({
        added: function (docId, newDoc) {
            view.room.position = new THREE.Vector3().fromArray(newDoc.position);
            view.room.quaternion = new THREE.Quaternion().fromArray(newDoc.quaternion);
            view.room.scale = new THREE.Vector3().fromArray(newDoc.scale);
            view.room.loaded = true;
            loadIntersection();
        }
    });
    let remoteRoomUpdates = Rooms.find({ id: remoteWorldId });
    remoteRoomUpdates.observeChanges({
        added: function (docId, newDoc) {
            view.remoteRoom.position = new THREE.Vector3().fromArray(newDoc.position);
            view.remoteRoom.quaternion = new THREE.Quaternion().fromArray(newDoc.quaternion);
            view.remoteRoom.scale = new THREE.Vector3().fromArray(newDoc.scale);
            view.remoteRoom.loaded = true; 
            loadIntersection();
        }
    });

    // Users
    WorldServer.call("users.insert", clientId, worldId); // Insert current client
    Users = new Mongo.Collection("users", { connection: WorldServer });
    WorldServer.subscribe("users");
    let remoteUserUpdates = Users.find({ clientId: { $ne: clientId } });
    remoteUserUpdates.observeChanges({
        added: function (docId, newDoc) {
            newDoc._id = docId;
            let newAvatarColor = (newDoc.worldId == "A") ? 0x0000ff : 0xffff00;
            newDoc.avatar = newAvatar(newAvatarColor);
            newDoc.avatar.avatar.position.fromArray(newDoc.position);
            newDoc.avatar.head.rotation.fromArray(newDoc.headRotation);

            if (newDoc.worldId != worldId) {
                newDoc.avatar.avatar.position.applyMatrix4(mappings.remoteLocal.positionMap);
                newDoc.avatar.head.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(mappings.remoteLocal.rotationMap));
            }
            view.scene.add(newDoc.avatar.avatar);
            newDoc.avatar.avatar.visible = checkShareRemote(newDoc.avatar.avatar.position.clone());
            view.remoteUsers.push(newDoc);

            // SHARED COFEE
            let dir = new THREE.Vector3(0.0, 0.0, -1.0).applyQuaternion(newDoc.avatar.head.quaternion);
            let mx = new THREE.Matrix4().lookAt(
                new THREE.Vector3(dir.x, 0.0, dir.z),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 1, 0)
            );
            let mugPos = new THREE.Vector3(-0.20, 0.0, -0.20).applyMatrix4(mx);
            mugPos.y = -0.4;
            newDoc.avatar.mug.position.copy(mugPos);
            newDoc.avatar.mug.setRotationFromMatrix(mx);

            render();
        }, 
        changed: function (docId, newDoc) {
            let updates = view.remoteUsers.filter(function (user) {
                return user._id == docId;
            });
            if (updates.length > 0) {
                let updatedUser = updates[0];
                let p = newDoc.position;
                if (p) {
                    updatedUser.avatar.avatar.position.fromArray(p);
                    if (updatedUser.worldId != worldId) {
                        updatedUser.avatar.avatar.position.applyMatrix4(mappings.remoteLocal.positionMap);
                    }
                    updatedUser.avatar.avatar.visible = checkShareRemote(updatedUser.avatar.avatar.position.clone());
                }
                let r = newDoc.headRotation;
                if (r) {
                    updatedUser.avatar.head.rotation.fromArray(r);
                    if (updatedUser.worldId != worldId) {
                        updatedUser.avatar.head.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(mappings.remoteLocal.rotationMap));
                    }

                    // SHARED COFEE
                    let dir = new THREE.Vector3(0.0, 0.0, -1.0).applyQuaternion(updatedUser.avatar.head.quaternion);
                    let mx = new THREE.Matrix4().lookAt(
                        new THREE.Vector3(dir.x, 0.0, dir.z),
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0, 1, 0)
                    );
                    let mugPos = new THREE.Vector3(-0.20, 0.0, -0.20).applyMatrix4(mx);
                    mugPos.y = -0.4;
                    updatedUser.avatar.mug.position.copy(mugPos);
                    updatedUser.avatar.mug.setRotationFromMatrix(mx);
                }
            }

            render();
        },
        removed: function (docId) {
            let updates = view.remoteUsers.filter(function (user) {
                return user._id == docId;
            });
            if (updates.length > 0) {
                view.scene.remove(updates[0].avatar.avatar);
                view.remoteUsers = view.remoteUsers.filter(function (user) {
                    return user != updates[0];
                });
            }
        }
    });

}

window.onload = function () {
    initThree();
    initControls();
    sync();
    
    update();
}

window.onbeforeunload = function () {
    // Disconnect client 
    WorldServer.call("users.remove", clientId);
}