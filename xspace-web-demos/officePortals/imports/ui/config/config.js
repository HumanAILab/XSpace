import "./config.css";
import "./config.html";

import { Users } from '../../api/users.js';
import { PortalPairs } from '../../api/portalPairs.js';

import { Meteor } from 'meteor/meteor';

import * as THREE from '../../lib/three/three.module.js';
import { GLTFLoader } from '../../lib/three/GLTFLoader.js';
import { OrbitControls } from "../../lib/three/OrbitControls.js";
import { TransformControls } from "../../lib/three/TransformControls.js";


Template.App_config.onCreated(() => {
    // Canvas and Renderer 
    let canvas, renderer;

    // Views
    var viewA = {
        viewport: null,
        scene: null,
        camera: null,
        room: new THREE.Mesh(),
        orbitControl: null,
        transformControl: null,
        portals: []
    }
    var viewB = {
        viewport: null,
        scene: null,
        camera: null,
        room: new THREE.Mesh(),
        orbitControl: null,
        transformControl: null,
        portals: []
    }

    // Portals 
    var portalPairs = []; 

    // Avatars 
    var avatars = [];

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
    var addPortalBtn, confirmBtn;

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
    function loadRoom(id) { // "A" or "B"
        let color = (id == "A") ? 0xcfe2f3 : 0xffe599;
        Promise.all([
            loadModelGLTF("room" + id + ".gltf", color)
        ]).then(values => {
            let mesh = values[0];

            // TODO: Enable more flexible room setting. 
            // Currently, this is hard-coded
            if (id == "A") {
                // room A mesh
                viewA.room.geometry = mesh.geometry.clone();
                viewA.room.material = mesh.material.clone();
            }
            else {
                // Room mesh
                viewB.room.geometry = mesh.geometry.clone();
                viewB.room.material = mesh.material.clone();
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
        renderView(viewA.scene, viewA.camera, viewA.viewport);
        renderView(viewB.scene, viewB.camera, viewB.viewport);
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

        // Scenes
        viewA.scene = new THREE.Scene();
        viewA.scene.background = new THREE.Color(0xdedede);
        viewB.scene = new THREE.Scene();
        viewB.scene.background = new THREE.Color(0xdedede);

        // Cameras
        viewA.camera = newCamera(camWorldParams, viewA.viewport);
        viewA.scene.add(viewA.camera);
        viewB.camera = newCamera(camWorldParams, viewB.viewport);
        viewB.scene.add(viewB.camera);

        // Lighting
        lightScenes();

        // Import room meshes
        viewA.scene.add(viewA.room);
        viewB.scene.add(viewB.room);

        render();
    }

    // Function for resetting the database (for Debugging purposes)
    function resetDBs() {
        Meteor.call("rooms.reset");
        Meteor.call("users.reset");
        Meteor.call("portalPairs.reset");
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

    // Applying transform changes 
    /*
    function applyPortalTransformChanges(view) {
        let updatedPortal = view.transformControl.object;
        let newPosition = [];
        let newRotation = [];
        let newScale = [];
        updatedPortal.position.toArray(newPosition);
        updatedPortal.rotation.toArray(newRotation);
        updatedPortal.scale.toArray(newScale);
        let portalPair;
        if (view.id == "A") {
            portalPair = portalPairs.filter(function (pair) {
                return pair.aPortal == updatedPortal;
            })[0];
            Meteor.call("portalPairs.updateA", portalPair._id, newPosition, newRotation, newScale);
            console.log(newRotation);
            Meteor.call("portalPairs.updateBScale", portalPair._id, newScale);
        } else {
            portalPair = portalPairs.filter(function (pair) {
                return pair.bPortal == updatedPortal;
            })[0];
            Meteor.call("portalPairs.updateB", portalPair._id, newPosition, newRotation, newScale);
            Meteor.call("portalPairs.updateAScale", portalPair._id, newScale);
        }
    }
    */

    // Toggling transform modes 
    // Here we just apply it to moving portals
    function toggleTransform(event, view) {
        switch (event.keyCode) {
            case 84: // T
                view.transformControl.setMode("translate");
                view.transformControl.showX = true;
                view.transformControl.showY = true;
                view.transformControl.showZ = true;
                render();
                break;
            case 82: // R
                view.transformControl.setMode("rotate");
                view.transformControl.showX = false;
                view.transformControl.showY = true;
                view.transformControl.showZ = false;
                render();
                break;
            case 69: // E
                view.transformControl.setMode("scale");
                view.transformControl.showX = true;
                view.transformControl.showY = true;
                view.transformControl.showZ = false;
                render();
                break;
            case 27: // Esc
                //applyPortalTransformChanges(view);
                view.transformControl.detach();
                render();
                break;
        }
    }

    // Constrain portal scale 
    function constrainPortalScale(portals, portal) {
        let i = portals.indexOf(portal);
        if (i >= 0) {
            viewA.portals[i].scale.copy(portal.scale);
            viewB.portals[i].scale.copy(portal.scale);
        }
    }

    // Initializing transform controls 
    function initTransformControls(view) {
        // New Transform Controls 
        view.transformControl = new TransformControls(view.camera, view.viewport);

        // Render on change 
        view.transformControl.addEventListener("change", function () {
            if (view.transformControl.getMode() == "scale") {
                constrainPortalScale(view.portals, view.transformControl.object);
            }
            render();
        });

        // Disable orbit controller on dragging 
        view.transformControl.addEventListener("dragging-changed", function (event) {
            view.orbitControl.enabled = !event.value;
        });
        // Add to scene 
        view.scene.add(view.transformControl);
    }

    // Attaching Transform Controller 
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

        let intersects = raycaster.intersectObjects(view.portals, true);
        if (intersects.length > 0) {
            view.transformControl.attach(intersects[0].object);
            view.transformControl.setMode("translate");
            view.transformControl.showX = true;
            view.transformControl.showZ = true;
            view.transformControl.showY = true;

        }

        render();
    }

    // Initialize Controls 
    function initControls() {
        // Orbit 
        // in viewA
        viewA.orbitControl = new OrbitControls(viewA.camera, viewA.viewport);
        viewA.orbitControl.update();
        viewA.orbitControl.addEventListener("change", render);
        // in viewB
        viewB.orbitControl = new OrbitControls(viewB.camera, viewB.viewport);
        viewB.orbitControl.update();
        viewB.orbitControl.addEventListener("change", render);

        // Transform 
        // in viewA
        initTransformControls(viewA);
        viewA.transformControl.setRotationSnap(Math.PI * 0.5);
        var toggleTransformControlA = function (event) {
            toggleTransform(event, viewA);
        }
        viewA.viewport.addEventListener(
            "keydown",
            toggleTransformControlA
        );
        var attachTransformA = function (event) {
            attachTransform(event, viewA);
        };
        viewA.viewport.addEventListener("dblclick", attachTransformA);
        // in view B
        initTransformControls(viewB);
        viewB.transformControl.setRotationSnap(Math.PI * 0.5);
        var toggleTransformControlB = function (event) {
            toggleTransform(event, viewB);
        }
        viewB.viewport.addEventListener(
            "keydown",
            toggleTransformControlB
        );
        var attachTransformB = function (event) {
            attachTransform(event, viewB);
        };
        viewB.viewport.addEventListener("dblclick", attachTransformB);

        // Adding portals 
        addPortalBtn = document.getElementById("addPortal");
        addPortalBtn.addEventListener("click", function (event) {
            // Meteor.call("portalPairs.addPair");
            let portals = addPortal(
                [0, 1, 0], [0, 0, 0, 0], [1, 1, 1],
                [0, 1, 0], [0, 0, 0, 0], [1, 1, 1]
            );
            portalPairs.push(portals);
        });

        // Confirm portal placement 
        confirmBtn = document.getElementById("confirm");
        confirmBtn.addEventListener("click", function (event) {
            let numPortals = portalPairs.length;
            for (let i = 0; i < numPortals; i++) {
                let aPos = [], aRot = [], aScale = [], bPos = [], bRot = [], bScale = [];
                portalPairs[i].aPortal.position.toArray(aPos);
                portalPairs[i].aPortal.quaternion.toArray(aRot);
                portalPairs[i].aPortal.scale.toArray(aScale);
                portalPairs[i].bPortal.position.toArray(bPos);
                portalPairs[i].bPortal.quaternion.toArray(bRot);
                portalPairs[i].bPortal.scale.toArray(bScale);
                Meteor.call("portalPairs.addPair", aPos, aRot, aScale, bPos, bRot, bScale);
            }
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
        addPortalBtn.style.display = "inline-block";
        confirmBtn.style.display = "inline-block";
        document.getElementById("waitingMessage").style.display = "none";
    }

    // Adding portals 
    function addPortal(aPositionArray, aRotationArray, aScaleArray, bPositionArray, bRotationArray, bScaleArray) {
        let portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.FrontSide
        });
        let aPortal = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1, 1, 1),
            portalMaterial.clone()
        );
        aPortal.position.fromArray(aPositionArray);
        aPortal.quaternion.fromArray(aRotationArray);
        aPortal.scale.fromArray(aScaleArray);
        viewA.scene.add(aPortal);
        viewA.portals.push(aPortal);

        let bPortal = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1, 1, 1),
            portalMaterial.clone()
        );
        bPortal.position.fromArray(bPositionArray);
        bPortal.quaternion.fromArray(bRotationArray);
        bPortal.scale.fromArray(bScaleArray);
        viewB.scene.add(bPortal);
        viewB.portals.push(bPortal);

        render();

        return { aPortal: aPortal, bPortal: bPortal };
    }

    // Synchronize with server collections 
    function sync() {

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
                    viewA.scene.add(avatar.avatar);
                } else {
                    viewB.scene.add(avatar.avatar);
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
                        updateAvatar[0].head.quaternion.fromArray(r);
                    }
                    render();
                }
            }
        });

        /*
        Meteor.subscribe("portalPairs");
        var portalUpdates = PortalPairs.find({});
        portalUpdates.observeChanges({
            added: function (docId, newDoc) {
                newDoc._id = docId;
                portals = addPortal(
                    newDoc.aPosition, newDoc.aRotation, newDoc.aScale,
                    newDoc.bPosition, newDoc.bRotation, newDoc.bScale
                );
                newDoc.aPortal = portals.aPortal;
                newDoc.bPortal = portals.bPortal;
                portalPairs.push(newDoc);
            },
            changed: function (docId, newDoc) {
                var updated = portalPairs.filter(function (pair) {
                    return pair._id = docId;
                })[0];
                if (newDoc.aPosition) {
                    updated.aPosition = newDoc.aPosition;
                    updated.aPortal.position.fromArray(updated.aPosition);
                }
                if (newDoc.aRotation) {
                    updated.aRotation = newDoc.aRotation;
                    updated.aPortal.rotation.fromArray(updated.aRotation);
                }
                if (newDoc.aScale) {
                    updated.aScale = newDoc.aScale;
                    updated.aPortal.scale.fromArray(updated.aScale);
                }
                if (newDoc.bPosition) {
                    updated.bPosition = newDoc.bPosition;
                    updated.bPortal.position.fromArray(updated.bPosition);
                }
                if (newDoc.bRotation) {
                    updated.bRotation = newDoc.bRotation;
                    updated.bPortal.rotation.fromArray(updated.bRotation);
                }
                if (newDoc.bScale) {
                    updated.bScale = newDoc.bScale;
                    updated.bPortal.scale.fromArray(updated.bScale);
                }
                render();
            }
        });
        */
    }

    window.onload = function () {
        resetDBs();
        initThree();
        initControls();
        sync();
    }
});