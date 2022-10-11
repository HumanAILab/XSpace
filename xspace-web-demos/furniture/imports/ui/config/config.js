import "./config.css";
import "./config.html";

import { Users } from '../../api/users.js';
import { Alignment } from '../../api/alignment.js';
import { Furniture } from '../../api/furniture.js';

import { Meteor } from 'meteor/meteor';

import * as THREE from '../../lib/three/three.module.js';
import { GLTFLoader } from '../../lib/three/GLTFLoader.js';
import { OBJLoader } from '../../lib/three/OBJLoader.js';
import { OrbitControls } from "../../lib/three/OrbitControls.js";
import { TransformControls } from "../../lib/three/TransformControls.js";

Template.App_config.onCreated(() => {
    // Canvas and Renderer 
    let canvas, renderer;

    // Views
    var viewBuild = {
        viewport: null,
        scene: null,
        camera: null,
        room: new THREE.Mesh(),
        dollhouse: new THREE.Mesh(),
        orbitControl: null,
        transformControl: null
    }

    // Avatars 
    var avatars = [];

    // Furniture
    var furniture = [];

    // Conditions for allowing scene
    var conditions = {
        numUsers: 0,
        userAMesh: false,
        userBMesh: false
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
    var confirmBtn; 

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
    function loadRoom(id) { // "A" or "B"
        let color = (id == "A") ? 0xcfe2f3 : 0xffe599;
        Promise.all([
            loadModelGLTF("room" + id + ".gltf", color)
        ]).then(values => {
            let mesh = values[0];

            // TODO: Enable more flexible dollhouse setting. 
            // Currently, we hard - code the dollhouse to be user A's room
            if (id == "A") {
                // Dollhouse mesh
                viewBuild.dollhouse.geometry = mesh.geometry.clone();
                viewBuild.dollhouse.material = mesh.material.clone();
            }
            else {
                // Room mesh
                viewBuild.room.geometry = mesh.geometry.clone();
                viewBuild.room.material = mesh.material.clone();
            }

            render();
        });
    }

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
        viewBuild.viewport = document.getElementById("viewBuilder");

        // Scenes
        viewBuild.scene = new THREE.Scene();
        viewBuild.scene.background = new THREE.Color(0xdedede);

        // Lighting
        lightScenes();

        // Cameras 
        viewBuild.camera = newCamera(camWorldParams, viewBuild.viewport);
        viewBuild.scene.add(viewBuild.camera);

        // Import room meshes
        viewBuild.scene.add(viewBuild.room);
        viewBuild.room.add(viewBuild.dollhouse);

        render();
    }

    // Function for resetting the database (for Debugging purposes)
    function resetDBs() {
        Meteor.call("rooms.reset");
        Meteor.call("alignment.reset");
        Meteor.call("users.reset");
        Meteor.call("furniture.reset");
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

    // Initialize Controls 
    function initControls() {
        // Orbit 
        viewBuild.orbitControl = new OrbitControls(viewBuild.camera, viewBuild.viewport);
        viewBuild.orbitControl.update();
        viewBuild.orbitControl.addEventListener("change", render);

        // Transform 
        viewBuild.transformControl = new TransformControls(viewBuild.camera, viewBuild.viewport);
        viewBuild.transformControl.addEventListener("change", render);
        viewBuild.transformControl.addEventListener("dragging-changed", function (event) {
            viewBuild.orbitControl.enabled = !event.value;
        });
        var toggleTransformControl = function (event) {
            toggleTransform(event, viewBuild);
        };
        viewBuild.viewport.addEventListener(
            "keydown",
            toggleTransformControl
        );
        viewBuild.scene.add(viewBuild.transformControl);
        viewBuild.transformControl.attach(viewBuild.dollhouse);

        // Update dollhouse state in server
        confirmBtn = document.getElementById("setDollhouse");
        confirmBtn.addEventListener("click", function (event) {
            let pos = []; 
            let rot = [];
            let scale = [];
            viewBuild.dollhouse.position.toArray(pos);
            viewBuild.dollhouse.quaternion.toArray(rot);
            viewBuild.dollhouse.scale.toArray(scale);
            Meteor.call("alignment.move", pos);
            Meteor.call("alignment.rotate", rot);
            Meteor.call("alignment.scale", scale);
        });
    }

    // Functions for checking system state
    function checkConditions() {
        if (conditions.numUsers < 2) {
            document.getElementById("waitingMessage").innerHTML = "Waiting for 1 player to join..."
            return false;
        }
        if (!conditions.userAMesh || !conditions.userBMesh) { // if one of them is not loaded:
            document.getElementById("waitingMessage").innerHTML = "Waiting for mesh scans to import..."
            return false;
        }
        conditionsMet();
        return true;
    }
    function conditionsMet() {
        console.log("Conditions met!");
        confirmBtn.style.display = "inline-block";
        document.getElementById("waitingMessage").style.display = "none";
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

    // Synchronize with server collections 
    function sync() {
        // Alignment
        Meteor.subscribe("alignment");
        let alignmentUpdates = Alignment.find({});
        alignmentUpdates.observeChanges({
            added: function (docId, newDoc) {
                viewBuild.dollhouse.position.fromArray(newDoc.position);
                viewBuild.dollhouse.quaternion.fromArray(newDoc.rotation);
                viewBuild.dollhouse.scale.fromArray(newDoc.scale);
            }
        })

        // Users 
        Meteor.subscribe("users");
        let usersUpdates = Users.find({});
        usersUpdates.observeChanges({
            added: function (docId, newDoc) {
                // Increment user count 
                conditions.numUsers += 1;
                // Load mesh
                loadRoom(newDoc.worldId);
                // Update conditions 
                conditions.userAMesh = (newDoc.worldId == "A") ? true : conditions.userAMesh;
                conditions.userBMesh = (newDoc.worldId == "B") ? true : conditions.userBMesh;
                // Check conditions 
                checkConditions();

                // Display avatar
                let newAvatarColor = newDoc.color;
                let avatar = newAvatar(newAvatarColor);

                // TODO: Current implementation hard-codes room A as the dollhouse of room B
                // We probably have to make this more flexible for the HoloLens demo
                if (newDoc.worldId == "A") {
                    viewBuild.dollhouse.add(avatar.avatar);
                } else {
                    viewBuild.room.add(avatar.avatar);
                }
                avatar.avatar.position.fromArray(newDoc.position);
                avatar.head.quaternion.fromArray(newDoc.rotation);
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
                    let r = newDoc.rotation;
                    if (r) {
                        // updateAvatar[0].rotation.set(r[0], r[1], r[2], 'YXZ');
                        updateAvatar[0].head.quaternion.fromArray(r);
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
                    viewBuild.room.add(newFurniture.object);
                    newFurniture.object.position.fromArray(newDoc.position);
                    newFurniture.object.quaternion.fromArray(newDoc.rotation);
                    newFurniture.object.scale.fromArray(newDoc.scale);
                    furniture.push(newFurniture);
                });
            }, 
            changed: function (docId, newDoc) {
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
        });

    }

    window.onload = function () {
        resetDBs();
        initThree();
        initControls();
        sync();
    }
});