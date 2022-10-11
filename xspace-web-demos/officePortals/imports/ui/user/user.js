import "./user.css";
import "./user.html";

import { Users } from '../../api/users.js';
import { PortalPairs } from '../../api/portalPairs.js';

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import * as THREE from '../../lib/three/three.module.js';
import { GLTFLoader } from '../../lib/three/GLTFLoader.js';
import { PointerLockControls } from "../../lib/three/PointerLockControls.js";
import { PortalVertexShader, PortalFragmentShader } from "../../lib/shaders.js";

import { Random } from 'meteor/random';

Template.App_user.onCreated(() => {
    // Canvas and Renderer 
    let canvas, renderer;

    // Views 
    let view = {
        viewport: null, 
        scene: null,
        camera: null,
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
            position: null,
            rotation: null
        },
        room: new THREE.Mesh(),
        portals: [],
        portalBuffers: [],
        portalMappings: [],
        remotePortalMatrices: [],
        remoteScene: null,
        remoteRoom: new THREE.Mesh(),
    }

    // Room Meshes 
    let roomMeshes = []; 

    // Camera set-up parameters
    let camFirstParams = {
        fov: 60,
        near: 0.1,
        far: 100,
        position: new THREE.Vector3(0.0, 1.5, 0.0),
        lookAt: new THREE.Vector3(0.0, 1.5, -1.0)
    };

    // For identification
    let userWorldId = null;
    userWorldId = FlowRouter.getParam("_id");
    let userClientId = Random.id();
    let userCollectionId = null; 

    // Remote users
    let otherUsers = []; 

    // Update variables
    let prevTime = performance.now();

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

    // Loading room GLTF models 
    let loadModelGLTF = function (source, color) {
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

        return {
            avatar: avatar,
            body: body,
            head: head
        };
    }

    // Adding portals 
    function addPortalPair(currPosArray, currRotArray, currScaleArray, remotePosArray, remoteRotArray, remoteScaleArray) {
        // Portal 
        var portalBuffer = new THREE.WebGLRenderTarget(view.viewport.clientWidth, view.viewport.clientHeight);
        var portal = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1, 1, 1),
            new THREE.ShaderMaterial({
                uniforms: {
                    cameraMatrix: { value: view.camera.matrixWorldInverse },
                    projMatrix: { value: view.camera.projectionMatrix },
                    viewFromPortal: { value: portalBuffer.texture }
                },
                vertexShader: PortalVertexShader,
                fragmentShader: PortalFragmentShader
            })
        );
        view.scene.add(portal);
        portal.position.fromArray(currPosArray);
        portal.quaternion.fromArray(currRotArray);
        portal.scale.fromArray(currScaleArray);
        view.portals.push(portal);
        view.portalBuffers.push(portalBuffer);
        // Mapping to remote portal 
        portal.updateMatrixWorld(true);
        var portalMapping = new THREE.Matrix4().getInverse(portal.matrixWorld);
        portalMapping.premultiply(new THREE.Matrix4().makeRotationY(-Math.PI));
        var remotePortalMatrix = new THREE.Matrix4().compose(
            new THREE.Vector3().fromArray(remotePosArray),
            new THREE.Quaternion().fromArray(remoteRotArray),
            new THREE.Vector3().fromArray(remoteScaleArray)
        );
        portalMapping.premultiply(remotePortalMatrix);
        view.portalMappings.push(portalMapping);
        view.remotePortalMatrices.push(remotePortalMatrix);
    }

    // Rendering portals 
    function renderPortals() {
        let numPortals = view.portals.length;
        for (let i = 0; i < numPortals; i++) {
            renderPortal(
                view.portalBuffers[i],
                view.portalMappings[i],
                view.remotePortalMatrices[i]
            );
        }
    }
    function renderPortal(portalBuffer, portalMapping, remotePortalMatrix) {
        renderer.setRenderTarget(portalBuffer);
        renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0), 1.0);
        renderer.clear(true, true, true);

        let portalCam = view.camera.clone();
        portalCam.matrixAutoUpdate = false;
        portalCam.matrixWorld.premultiply(portalMapping);
        portalCam.matrixWorldInverse.getInverse(portalCam.matrixWorld);
        portalCam.projectionMatrix.copy(updatePortalProjection(portalCam, remotePortalMatrix));

        renderer.render(view.remoteScene, portalCam);
        renderer.setRenderTarget(null);
        renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0), 0.0);
    }
    function updatePortalProjection(outCam, outPortal) {
        let dstRotationMatrix = new THREE.Matrix4()
            .identity()
            .extractRotation(outPortal);

        let normal = new THREE.Vector3().set(0, 0, 1).applyMatrix4(dstRotationMatrix);

        let clipPlane = new THREE.Plane();
        clipPlane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3().setFromMatrixPosition(outPortal));
        clipPlane.applyMatrix4(outCam.matrixWorldInverse);

        let clipVector = new THREE.Vector4().set(
            clipPlane.normal.x,
            clipPlane.normal.y,
            clipPlane.normal.z,
            clipPlane.constant
        );

        let projectionMatrix = new THREE.Matrix4().copy(outCam.projectionMatrix);

        let q = new THREE.Vector4();
        q.x =
            (Math.sign(clipVector.x) + projectionMatrix.elements[8]) /
            projectionMatrix.elements[0];
        q.y =
            (Math.sign(clipVector.y) + projectionMatrix.elements[9]) /
            projectionMatrix.elements[5];
        q.z = -1.0;
        q.w =
            (1.0 + projectionMatrix.elements[10]) /
            outCam.projectionMatrix.elements[14];

        clipVector.multiplyScalar(2.0 / clipVector.dot(q));

        projectionMatrix.elements[2] = clipVector.x;
        projectionMatrix.elements[6] = clipVector.y;
        projectionMatrix.elements[10] = clipVector.z + 1.0;
        projectionMatrix.elements[14] = clipVector.w;

        return projectionMatrix;
    }

    // Initializing three.js scene 
    function initThree() {
        // Canvas & Renderer
        canvas = document.getElementById("cUser");
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        // Views
        view.viewport = document.getElementById("viewFirstUser");

        // Scenes
        view.scene = new THREE.Scene();
        view.scene.background = new THREE.Color(0xdedede);
        view.remoteScene = new THREE.Scene();
        view.remoteScene.background = new THREE.Color(0xdedede);

        // Lighting 
        lightScene(view.scene);
        lightScene(view.remoteScene);

        // Cameras
        view.camera = newCamera(camFirstParams, view.viewport);
        view.scene.add(view.camera);

        // Room Meshes
        // Currently hard-coded for room A and B (TODO)
        view.scene.add(view.room);
        view.remoteScene.add(view.remoteRoom);
        Promise.all([
            loadModelGLTF("../roomA.gltf", 0xcfe2f3),
            loadModelGLTF("../roomB.gltf", 0xffe599)
        ]).then(result => {
            roomMeshes.push(result[0]);
            roomMeshes.push(result[1]);
            
            let roomIdx, remoteRoomIdx;
            roomIdx = (userWorldId == "A") ? 0 : 1;
            remoteRoomIdx = (userWorldId != "A") ? 0 : 1;
            view.room.geometry = roomMeshes[roomIdx].geometry.clone();
            view.room.material = roomMeshes[roomIdx].material.clone();
            view.remoteRoom.geometry = roomMeshes[remoteRoomIdx].geometry.clone();
            view.remoteRoom.material = roomMeshes[remoteRoomIdx].material.clone();

            render();
        });
    }

    // Adding user to server Users collection 
    function initLocalUser() {
        let pos = [];
        let rot = [];
        view.camera.position.toArray(pos);
        view.camera.quaternion.toArray(rot);
        Meteor.call("users.insert", userClientId, userWorldId, false, pos, rot);
    }

    // Synchronize local collections with server 
    function sync() {

        // Users
        Meteor.subscribe("users");
        let usersUpdates = Users.find({});
        usersUpdates.observeChanges({
            added: function (docId, newDoc) {
                let newUserColor = newDoc.color;
                let newUser = newAvatar(newUserColor);
                newUser.avatar.position.fromArray(newDoc.position);
                newUser.head.quaternion.fromArray(newDoc.rotation);

                // Hard-coded for room A and B (TODO)
                if (newDoc.worldId == userWorldId) {
                    view.scene.add(newUser.avatar);
                } else {
                    view.remoteScene.add(newUser.avatar);
                }

                if (userClientId == newDoc.clientId) {
                    // The added entry is from this client
                    userCollectionId = docId;
                    view.avatar = newUser;
                } else {
                    // The added entry is another user
                    otherUsers.push({
                        collectionId: docId,
                        clientId: newDoc.clientId,
                        worldId: newDoc.worldId,
                        avatar: newUser
                    });
                }
                render();
            },
            changed: function (docId, newDoc) {
                let updates = otherUsers.filter(function (avatar) {
                    return avatar.collectionId == docId;
                });
                if (updates.length > 0) {
                    let updatedUser = updates[0];
                    let p = newDoc.position;
                    if (p) {
                        updatedUser.avatar.avatar.position.fromArray(p);
                    }
                    let r = newDoc.rotation;
                    if (r) {
                        updatedUser.avatar.head.quaternion.fromArray(r);
                    }

                    render();
                }
            }
        });

        // Portal Pairs
        Meteor.subscribe("portalPairs");
        let portalPairsUpdates = PortalPairs.find({});
        portalPairsUpdates.observeChanges({
            added: function (docId, newDoc) {
                if (userWorldId == "A") {
                    addPortalPair(newDoc.aPosition, newDoc.aRotation, newDoc.aScale, newDoc.bPosition, newDoc.bRotation, newDoc.bScale);
                } else {
                    addPortalPair(newDoc.bPosition, newDoc.bRotation, newDoc.bScale, newDoc.aPosition, newDoc.aRotation, newDoc.aScale);
                }
                render();
            }
        });
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
    

    // Setting up controls 
    function initControls() {
        // Set up PointerLock controls 
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

    // Handling user movement
    function moveUser(delta) {
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

    // Handling user avatar updates
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
        }
    }

    // Update users in remote User Collection 
    function serverUpdateUser() {
        if (userCollectionId != null) {
            if (view.avatarPrevState.position == null) {
                view.avatarPrevState.position = new THREE.Vector3().copy(view.avatar.avatar.position);
            }
            if (view.avatarPrevState.rotation == null) {
                view.avatarPrevState.rotation = new THREE.Quaternion().copy(view.avatar.head.quaternion);
            }
            
            if (view.avatarPrevState.position.distanceTo(view.avatar.avatar.position) > 0.2) {
                let pos = [];
                view.avatar.avatar.position.toArray(pos);
                Meteor.call("users.move", userCollectionId, pos);
                view.avatarPrevState.position.copy(view.avatar.avatar.position);
            }

            if (view.avatarPrevState.rotation.angleTo(view.avatar.head.quaternion) > 0.05) {
                let rot = [];
                view.avatar.head.quaternion.toArray(rot);
                Meteor.call("users.rotate", userCollectionId, rot);
                view.avatarPrevState.rotation.copy(view.avatar.head.quaternion);
            }
        }
    }
    

    function update() {
        requestAnimationFrame(update);

        let time = performance.now();
        let delta = (time - prevTime) / 1000;

        moveUser(delta);
        updateAvatar();
        serverUpdateUser();

        renderPortals();

        render();

        prevTime = time;
    }
 
    window.onload = function () {
        initThree();
        initLocalUser();
        initControls();
        sync();

        update();
    }
});