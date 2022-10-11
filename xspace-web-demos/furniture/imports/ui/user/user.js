import "./user.css";
import "./user.html";

import { Alignment } from '../../api/alignment.js';
import { Users } from "../../api/users.js";
import { Furniture } from "../../api/furniture.js";

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import * as THREE from '../../lib/three/three.module.js';
import { GLTFLoader } from '../../lib/three/GLTFLoader.js';
import { PointerLockControls } from "../../lib/three/PointerLockControls.js";
import { OBJLoader } from "../../lib/three/OBJLoader.js";

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
        dollhouse: new THREE.Mesh(),
        dollhouseBBox: null,
        selector: new THREE.Raycaster(),
        selected: null,
        selectDist: 0.0,
        selectedPrevState: {
            position: null,
            //rotation: null, 
            // Our current demo does not change the rotation of the selected object (TODO)
            scale: null
        }
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

    // Furniture
    let furniture = [];
    let furnitureObjects = []; 

    // Update variables
    let prevTime = performance.now();

    // Controls 
    var addChairBtn;

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

        // Lighting 
        lightScene(view.scene);

        // Add room and dollhouse to scene
        view.scene.add(view.room);
        view.room.add(view.dollhouse);

        // Cameras
        // Currently hard-coded for room A and B (TODO)
        if (userWorldId == "A") {
            view.camera = newCamera(camFirstParams, view.viewport);
            view.dollhouse.add(view.camera);
        } else {
            view.camera = newCamera(camFirstParams, view.viewport);
            view.room.add(view.camera);
        }

        // Room Meshes
        // Currently hard-coded for room A and B (TODO)
        Promise.all([
            loadModelGLTF("../roomA.gltf", 0xcfe2f3),
            loadModelGLTF("../roomB.gltf", 0xffe599)
        ]).then(result => {
            roomMeshes.push(result[0]);
            roomMeshes.push(result[1]);
            
            let roomIdx, remoteRoomIdx;
            roomIdx = (userWorldId == "A") ? 0 : 1;
            remoteRoomIdx = (userWorldId != "A") ? 0 : 1;
            if (userWorldId == "A") {
                view.dollhouse.geometry = roomMeshes[roomIdx].geometry.clone();
                view.dollhouse.material = roomMeshes[roomIdx].material.clone();
                view.room.geometry = roomMeshes[remoteRoomIdx].geometry.clone();
                view.room.material = roomMeshes[remoteRoomIdx].material.clone();
            } else {
                view.dollhouse.geometry = roomMeshes[remoteRoomIdx].geometry.clone();
                view.dollhouse.material = roomMeshes[remoteRoomIdx].material.clone();
                view.room.geometry = roomMeshes[roomIdx].geometry.clone();
                view.room.material = roomMeshes[roomIdx].material.clone();
            }

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

    // Load furniture OBJ 
    function loadFurnitureMesh(obj, color) {
        let material = new THREE.MeshLambertMaterial({
            flatShading: true,
            side: THREE.DoubleSide,
            color: color,
            transparent: true
        });
        let bufferGeometry = obj.children[0].geometry;
        let geometry = new THREE.Geometry().fromBufferGeometry(
            bufferGeometry
        );
        let mesh = new THREE.Mesh(geometry, material);
        mesh.geometry.computeBoundingBox();
        let bbCenter = mesh.geometry.boundingBox.getCenter();
        let bbSize = mesh.geometry.boundingBox.getSize();
        let xOffset = -bbCenter.x;
        let yOffset = -bbCenter.y + (0.5 * bbSize.y);
        let zOffset = -bbCenter.z;
        mesh.geometry.translate(xOffset, yOffset, zOffset);
        return mesh;
    }

    // Synchronize local collections with server 
    function sync() {
        // Alignment
        Meteor.subscribe("alignment");
        let alignmentUpdates = Alignment.find({});
        alignmentUpdates.observeChanges({
            added: function (docId, newDoc) {
                view.dollhouse.position.fromArray(newDoc.position);
                view.dollhouse.quaternion.fromArray(newDoc.rotation);
                view.dollhouse.scale.fromArray(newDoc.scale);
            },
            changed: function (docId, newDoc) {
                if (newDoc.position) 
                    view.dollhouse.position.fromArray(newDoc.position);
                if (newDoc.rotation)
                    view.dollhouse.quaternion.fromArray(newDoc.rotation);
                if (newDoc.scale) 
                    view.dollhouse.scale.fromArray(newDoc.scale);

                let dollhouseSize = new THREE.Vector3();
                view.dollhouse.geometry.computeBoundingBox();
                view.dollhouse.geometry.boundingBox.getSize(dollhouseSize);
                dollhouseSize.multiplyScalar(0.125);
                view.dollhouseBBox = new THREE.Box3().setFromCenterAndSize(view.dollhouse.position, dollhouseSize);

                render();
            }
        })

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
                if (newDoc.worldId == "A") {
                    view.dollhouse.add(newUser.avatar);
                } else {
                    view.room.add(newUser.avatar);
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

        // Furniture 
        Meteor.subscribe("furniture");
        let furnitureUpdates = Furniture.find({});
        furnitureUpdates.observeChanges({
            added: function (docId, newDoc) {
                let color = 0xffffff;
                let loader = new OBJLoader();
                loader.load(newDoc.source, function (obj) {
                    let newFurniture = {
                        id: docId,
                        object: loadFurnitureMesh(obj, color)
                    };
                    view.room.add(newFurniture.object);
                    newFurniture.object.position.fromArray(newDoc.position);
                    newFurniture.object.quaternion.fromArray(newDoc.rotation);
                    newFurniture.object.scale.fromArray(newDoc.scale);
                    furnitureObjects.push(newFurniture.object);
                    furniture.push(newFurniture);

                    render();
                });
            },
            changed: function (docId, newDoc) {
                if (view.selected != null) {
                    if (docId != view.selected.id) {
                        let selected = furniture.filter(function (f) {
                            return f.id == docId;
                        });
                        if (newDoc.position) {
                            selected[0].object.position.fromArray(newDoc.position);
                        }
                        if (newDoc.scale) {
                            selected[0].object.scale.fromArray(newDoc.scale);
                        }
                    }
                } else {
                    let selected = furniture.filter(function (f) {
                        return f.id == docId;
                    });
                    if (newDoc.position) {
                        selected[0].object.position.fromArray(newDoc.position);
                    }
                    if (newDoc.scale) {
                        selected[0].object.scale.fromArray(newDoc.scale);
                    }
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

    // For selecting and moving furniture 
    function selectFurniture() {
        if (view.selected == null) {
            view.selector.setFromCamera(new THREE.Vector2(0.0, 0.0), view.camera);
            let selectedObjects = view.selector.intersectObjects(furnitureObjects);
            if (selectedObjects.length > 0) {
                let selectedObject = selectedObjects[0].object;
                let selected = furniture.filter(function (f) {
                    return f.object == selectedObject;
                });
                view.selected = selected[0];
                let avatarPosition = view.avatar.avatar.position.clone();
                // Hard-coded A for dollhouse (TODO)
                if (userWorldId == "A") {
                    avatarPosition = view.dollhouse.localToWorld(avatarPosition);
                }
                view.selectDist = new THREE.Vector3().copy(avatarPosition).distanceTo(view.selected.object.position);
            }
        } else {
            view.selected = null;
            view.selectedPrevState.position = null;
            view.selectedPrevState.scale = null;
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
            } else {
                selectFurniture();
            }
        });
        view.pointerLock.addEventListener("unlock", function (event) {
            document.removeEventListener("keydown", wasdDown);
            document.removeEventListener("keyup", wasdUp);
        });

        // Adding furniture
        addChairBtn = document.getElementById("addChair");
        addChairBtn.addEventListener("click", function (event) {
            let pos = []; 
            let scale = [1.0, 1.0, 1.0];
            let forwardDirection = new THREE.Vector3();
            view.pointerLock.getDirection(forwardDirection);
            let avatarPosition = view.avatar.avatar.position.clone();
            if (userWorldId == "A") {
                let dollhouseScale = Alignment.findOne({}).scale;
                scale = [0.125, 0.125, 0.125];
                forwardDirection.multiplyScalar(0.125);
                avatarPosition = view.dollhouse.localToWorld(avatarPosition);
            }
            let updatedPosition = avatarPosition.add(forwardDirection);
            updatedPosition.toArray(pos);
            Meteor.call("furniture.add", "../chair.obj", pos, [0.0, 0.0, 0.0, 1.0], scale);

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

        if (view.avatar.headBody != null &&
            view.avatar.bodyBody != null) {
            updateAvatarCannonBodies(view.avatar);
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

    // Update selected furniture 
    function updateSelected() {
        if (view.selected != null) {
            let forwardDirection = new THREE.Vector3();
            view.pointerLock.getDirection(forwardDirection);
            let avatarPosition = view.avatar.avatar.position.clone();
            // Hard-coded (TODO)
            if (userWorldId == "A") {
                avatarPosition = view.dollhouse.localToWorld(avatarPosition);
            }
            forwardDirection.multiplyScalar(view.selectDist);
            let updatedPosition = avatarPosition.add(forwardDirection);
            view.selected.object.position.copy(updatedPosition);
            
            if (view.dollhouseBBox.containsPoint(view.selected.object.position)) {
                //console.log("In dollhouse");
                view.selected.object.scale.set(0.125, 0.125, 0.125);
            } else {
                //console.log("Outside dollhouse");
                view.selected.object.scale.set(1.0, 1.0, 1.0);
            }
        }
    }

    // Update furniture state in the remote Furniture Collection
    function serverUpdateFurniture() {
        if (view.selected != null) {
            if (view.selectedPrevState.position == null) {
                view.selectedPrevState.position = new THREE.Vector3().copy(view.selected.object.position);
            }
            if (view.selectedPrevState.scale == null) {
                view.selectedPrevState.scale = new THREE.Vector3().copy(view.selected.object.scale);
            }

            if (view.selectedPrevState.position.distanceTo(view.selected.object.position) > (0.2 * view.selected.object.scale.x)) {
                let pos = [];
                view.selected.object.position.toArray(pos);
                Meteor.call("furniture.move", view.selected.id, pos);
                view.selectedPrevState.position.copy(view.selected.object.position);
            }

            if (!view.selectedPrevState.scale.equals(view.selected.object.scale)) {
                let scale = [];
                view.selected.object.scale.toArray(scale);
                Meteor.call("furniture.scale", view.selected.id, scale);
                view.selectedPrevState.scale.copy(view.selected.object.scale);
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
        updateSelected();
        serverUpdateFurniture();

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