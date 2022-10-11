import "./config.css";
import "./config.html";

import { Users } from '../../api/users.js';

import { Meteor } from 'meteor/meteor';

import * as THREE from '../../lib/three/three.module.js';
import { GLTFLoader } from '../../lib/three/GLTFLoader.js';
import { OrbitControls } from "../../lib/three/OrbitControls.js";
import { TransformControls } from "../../lib/three/TransformControls.js";
import { SliceGeometry } from "../../lib/three/slice.js";

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
        selectionBBox: {
            start: new THREE.Vector3(),
            end: new THREE.Vector3(),
            boundaries: []
        },
        sharedObjects: []
    }
    var viewB = {
        viewport: null,
        scene: null,
        camera: null,
        room: new THREE.Mesh(),
        orbitControl: null,
        transformControl: null,
        selectionBBox: {
            start: new THREE.Vector3(),
            end: new THREE.Vector3(),
            boundaries: []
        },
        sharedObjects: []
    }
    var viewAObject = {
        viewport: null,
        scene: null,
        camera: null,
        orbitControl: null,
        transformControl: null,
        object: null
    }
    var viewBObject = {
        viewport: null,
        scene: null,
        camera: null,
        orbitControl: null,
        transformControl: null,
        object: null
    }

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
    var camObjParams = {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: new THREE.Vector3(0.0, 2.5, 2.5),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
    };

    // Controls
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    // System operations 
    var sharingA = false; 
    var sharingB = false;
    var aligning = false; 

    // Object pairs 
    var objectPairs = []; 

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
        lightScene(viewAObject.scene);
        lightScene(viewBObject.scene);
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
        renderView(viewAObject.scene, viewAObject.camera, viewAObject.viewport);
        renderView(viewBObject.scene, viewBObject.camera, viewBObject.viewport);
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
        viewAObject.viewport = document.getElementById("viewAObject");
        viewBObject.viewport = document.getElementById("viewBObject");

        // Scenes
        viewA.scene = new THREE.Scene();
        viewA.scene.background = new THREE.Color(0xdedede);
        viewB.scene = new THREE.Scene();
        viewB.scene.background = new THREE.Color(0xdedede);
        viewAObject.scene = new THREE.Scene();
        viewAObject.scene.background = new THREE.Color(0xdedede);
        viewBObject.scene = new THREE.Scene();
        viewBObject.scene.background = new THREE.Color(0xdedede);

        // Cameras
        viewA.camera = newCamera(camWorldParams, viewA.viewport);
        viewA.scene.add(viewA.camera);
        viewB.camera = newCamera(camWorldParams, viewB.viewport);
        viewB.scene.add(viewB.camera);
        viewAObject.camera = newCamera(camObjParams, viewAObject.viewport);
        viewAObject.scene.add(viewAObject.camera);
        viewBObject.camera = newCamera(camObjParams, viewBObject.viewport);
        viewBObject.scene.add(viewBObject.camera);

        // Lighting
        lightScenes();

        // Import room meshes
        viewA.scene.add(viewA.room);
        viewB.scene.add(viewB.room);

        // Reference frames in viewAObject and viewBObject
        var referenceCoordsA = new TransformControls(viewAObject.camera, viewAObject.viewport);
        var referenceOriginA = new THREE.Object3D();
        referenceCoordsA.enabled = false;
        referenceCoordsA.setSize(2);
        viewAObject.scene.add(referenceOriginA);
        viewAObject.scene.add(referenceCoordsA);
        referenceCoordsA.attach(referenceOriginA);
        var referenceCoordsB = new TransformControls(viewBObject.camera, viewBObject.viewport);
        referenceCoordsB.enabled = false;
        referenceCoordsB.setSize(2);
        var referenceOriginB = new THREE.Object3D();
        viewBObject.scene.add(referenceOriginB);
        viewBObject.scene.add(referenceCoordsB);
        referenceCoordsB.attach(referenceOriginB);

        // Render
        render();
    }
    
    // Function for resetting the database (for Debugging purposes)
    function resetDBs() {
        Meteor.call("alignment.reset");
        Meteor.call("objectPairs.reset");
        Meteor.call("rooms.reset");
        Meteor.call("users.reset");
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
            case 27: // Esc
                view.transformControl.detach();
                render();
                break;
        }
    }
    
    // Initializing transform controls 
    function initTransformControls(view) {
        // New Transform Controls 
        view.transformControl = new TransformControls(view.camera, view.viewport);

        // Render on change 
        view.transformControl.addEventListener("change", render);

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

        let intersects = raycaster.intersectObjects(view.sharedObjects, true);
        if (intersects.length > 0) {
            view.transformControl.attach(intersects[0].object);
            view.transformControl.setMode("translate");
            view.transformControl.showX = true;
            view.transformControl.showZ = true;
            view.transformControl.showY = true;
        }

        render();
    }

    // Initializing orbit controls 
    function initOrbitControls(view) {
        view.orbitControl = new OrbitControls(view.camera, view.viewport);
        view.orbitControl.update();
        view.orbitControl.addEventListener("change", render);
    }

    // Selection bounding box operations 
    // Initialize selection bounding box 
    function initSelectBBox(view) {
        let numBounds = 4;
        let boundary;
        for (let i = 0; i < numBounds; i++) {
            boundary = new THREE.Mesh(
                new THREE.BoxGeometry(1.0, 2.0, 0.05),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.50 })
            );
            boundary.position.y = 1.0;
            boundary.visible = false;
            view.scene.add(boundary);
            view.selectionBBox.boundaries.push(boundary);
        }
    }
    // Set selection bounding box visibility 
    function setSelectBBoxVisible(boundaries, visible) {
        for (let i = 0; i < boundaries.length; i++) {
            boundaries[i].visible = visible;
        }
    }
    // Update selection bounding box boundaries
    function updateSelectBoundaries(boundaries, start, end) {
        let bl = start;
        let tr = end;
        let br = new THREE.Vector3(tr.x, 0.0, bl.z);
        let tl = new THREE.Vector3(bl.x, 0.0, tr.z);
        updateSelectBoundary(boundaries[0], bl, br);
        updateSelectBoundary(boundaries[1], br, tr);
        updateSelectBoundary(boundaries[2], tr, tl);
        updateSelectBoundary(boundaries[3], tl, bl);
    }
    function updateSelectBoundary(boundary, pointA, pointB) {
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
    }
    // Intersect ground plane
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
    // Placing selectBBox Starting Position
    function placingSelectBBoxStartA() {
        viewA.selectionBBox.start = intersectGround(viewA);
        viewA.selectionBBox.end = intersectGround(viewA);
        updateSelectBoundaries(viewA.selectionBBox.boundaries, viewA.selectionBBox.start, viewA.selectionBBox.end);
        setSelectBBoxVisible(viewA.selectionBBox.boundaries, true);
        render();
    }
    function placingSelectBBoxStartB() {
        viewB.selectionBBox.start = intersectGround(viewB);
        viewB.selectionBBox.end = intersectGround(viewB);
        updateSelectBoundaries(viewB.selectionBBox.boundaries, viewB.selectionBBox.start, viewB.selectionBBox.end);
        setSelectBBoxVisible(viewB.selectionBBox.boundaries, true);
        render();
    }
    // Place selectBBox Starting Position 
    function placeSelectBBoxStartA() {
        viewA.viewport.removeEventListener("mousemove", placingSelectBBoxStartA);
        viewA.viewport.addEventListener("mousemove", placingSelectBBoxEndA);
        viewA.viewport.removeEventListener("click", placeSelectBBoxStartA);
        viewA.viewport.addEventListener("click", placeSelectBBoxEndA);
    }
    function placeSelectBBoxStartB() {
        viewB.viewport.removeEventListener("mousemove", placingSelectBBoxStartB);
        viewB.viewport.addEventListener("mousemove", placingSelectBBoxEndB);
        viewB.viewport.removeEventListener("click", placeSelectBBoxStartB);
        viewB.viewport.addEventListener("click", placeSelectBBoxEndB);
    }
    // Placing selectBBox Ending Position
    function placingSelectBBoxEndA() {
        viewA.selectionBBox.end = intersectGround(viewA);
        updateSelectBoundaries(viewA.selectionBBox.boundaries, viewA.selectionBBox.start, viewA.selectionBBox.end);
        render();
    }
    function placingSelectBBoxEndB() {
        viewB.selectionBBox.end = intersectGround(viewB);
        updateSelectBoundaries(viewB.selectionBBox.boundaries, viewB.selectionBBox.start, viewB.selectionBBox.end);
        render();
    }
    // Place selectBBox Ending Position 
    function placeSelectBBoxEndA() {
        viewA.viewport.removeEventListener("mousemove", placingSelectBBoxEndA);
        viewA.viewport.removeEventListener("click", placeSelectBBoxEndA);
    }
    function placeSelectBBoxEndB() {
        viewB.viewport.removeEventListener("mousemove", placingSelectBBoxEndB);
        viewB.viewport.removeEventListener("click", placeSelectBBoxEndB);
    }

    // For extracting alignment / share objects
    function extractSelected(room, start, end) {
        var min = new THREE.Vector3(Math.min(start.x, end.x), 0.0, Math.min(start.z, end.z));
        var max = new THREE.Vector3(Math.max(start.x, end.x), 0.0, Math.max(start.z, end.z));

        var front = new THREE.Plane(new THREE.Vector3(0.0, 0.0, 1.0)).translate(min);
        var back = new THREE.Plane(new THREE.Vector3(0.0, 0.0, -1.0)).translate(max);
        var left = new THREE.Plane(new THREE.Vector3(1.0, 0.0, 0.0)).translate(min);
        var right = new THREE.Plane(new THREE.Vector3(-1.0, 0.0, 0.0)).translate(max);

        let objectGeometry = room.geometry.clone();
        objectGeometry = SliceGeometry(objectGeometry, right);
        objectGeometry = SliceGeometry(objectGeometry, left);
        objectGeometry = SliceGeometry(objectGeometry, front);
        objectGeometry = SliceGeometry(objectGeometry, back);

        let objectMaterial =
            new THREE.MeshLambertMaterial({
                flatShading: true,
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.75
            });

        let object = new THREE.Mesh(objectGeometry, objectMaterial);
        object.geometry.computeBoundingBox();
        let objectCenter = new THREE.Vector3();
        object.geometry.boundingBox.getCenter(objectCenter);
        object.geometry.translate(-objectCenter.x, -objectCenter.y, -objectCenter.z);
        object.position.copy(objectCenter);

        return object;
    }

    // Adding Shared Object
    function addShared(viewFrom, viewTo, start, end, yOrientation) {
        var originalObject = extractSelected(viewFrom.room, start, end);
        originalObject.geometry.rotateY(yOrientation);
        originalObject.rotateY(-yOrientation);
        var sharedObject = new THREE.Mesh(originalObject.geometry.clone(), originalObject.material.clone());
        originalObject.scale.set(1.05, 1.05, 1.05); // Scale original geometry for overlay 
        sharedObject.position.set(0.0, originalObject.position.y, 0.0);
        sharedObject.rotation.set(0, -yOrientation, 0);
        viewFrom.scene.add(originalObject);
        viewTo.scene.add(sharedObject);
        viewTo.sharedObjects.push(sharedObject);
        render();
        return { original: originalObject, shared: sharedObject };
    }
    
    // Adding Aligned Objects 
    function addAligned(aStart, aEnd, aYOrientation, bStart, bEnd, bYOrientation) {
        var aObject = extractSelected(viewA.room, aStart, aEnd);
        aObject.geometry.rotateY(aYOrientation);
        aObject.rotateY(-aYOrientation);
        aObject.scale.set(1.05, 1.05, 1.05);
        viewA.scene.add(aObject);
        
        var bObject = extractSelected(viewB.room, bStart, bEnd);
        bObject.geometry.rotateY(bYOrientation);
        bObject.rotateY(-bYOrientation);
        bObject.scale.set(1.05, 1.05, 1.05);
        viewB.scene.add(bObject);

        render();

        return {
            aObject: aObject,
            bObject: bObject
        }
    }

    // Initialize Controls 
    function initControls() {
        // Orbit 
        initOrbitControls(viewA);
        initOrbitControls(viewB);
        initOrbitControls(viewAObject);
        initOrbitControls(viewBObject);

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

        initTransformControls(viewAObject);
        viewAObject.transformControl.setMode("rotate");
        viewAObject.transformControl.showX = false;
        viewAObject.transformControl.showZ = false;
        viewAObject.transformControl.setRotationSnap(Math.PI * 0.5);

        initTransformControls(viewBObject);
        viewBObject.transformControl.setMode("rotate");
        viewBObject.transformControl.showX = false;
        viewBObject.transformControl.showZ = false;
        viewBObject.transformControl.setRotationSnap(Math.PI * 0.5);

        // Initialize selection boundaries 
        initSelectBBox(viewA);
        initSelectBBox(viewB);

        // Performing selections
        var selectA = document.getElementById("selectA");
        selectA.addEventListener("click", function () {
            setSelectBBoxVisible(viewA.selectionBBox.boundaries, false);
            render();
            viewA.viewport.addEventListener("mousemove", placingSelectBBoxStartA);
            viewA.viewport.addEventListener("click", placeSelectBBoxStartA);
        });
        var selectB = document.getElementById("selectB");
        selectB.addEventListener("click", function () {
            setSelectBBoxVisible(viewB.selectionBBox.boundaries, false);
            render();
            viewB.viewport.addEventListener("mousemove", placingSelectBBoxStartB);
            viewB.viewport.addEventListener("click", placeSelectBBoxStartB);
        });
        var clearA = document.getElementById("clearA");
        clearA.addEventListener("click", function () {
            setSelectBBoxVisible(viewA.selectionBBox.boundaries, false);
            render();
        });
        var clearB = document.getElementById("clearB");
        clearB.addEventListener("click", function () {
            setSelectBBoxVisible(viewB.selectionBBox.boundaries, false);
            render();
        });

        // Sharing objects 
        var shareA = document.getElementById("shareA");
        shareA.addEventListener("click", function () {
            var selectedObject = extractSelected(viewA.room, viewA.selectionBBox.start, viewA.selectionBBox.end);
            viewAObject.object = new THREE.Mesh(selectedObject.geometry.clone(), viewA.room.material.clone());
            viewAObject.object.position.y = selectedObject.position.y;
            viewAObject.scene.add(viewAObject.object);
            viewAObject.transformControl.attach(viewAObject.object);
            sharingA = true;
        });
        var shareB = document.getElementById("shareB");
        shareB.addEventListener("click", function () {
            var selectedObject = extractSelected(viewB.room, viewB.selectionBBox.start, viewB.selectionBBox.end);
            viewBObject.object = new THREE.Mesh(selectedObject.geometry.clone(), viewB.room.material.clone());
            viewBObject.object.position.y = selectedObject.position.y;
            viewBObject.scene.add(viewBObject.object);
            viewBObject.transformControl.attach(viewBObject.object);
            sharingB = true;
        });

        // Aligning objects 
        var align = document.getElementById("align");
        align.addEventListener("click", function () {
            var selectedA = extractSelected(viewA.room, viewA.selectionBBox.start, viewA.selectionBBox.end);
            viewAObject.object = new THREE.Mesh(selectedA.geometry.clone(), viewA.room.material.clone());
            viewAObject.scene.add(viewAObject.object);
            viewAObject.transformControl.attach(viewAObject.object);

            var selectedB = extractSelected(viewB.room, viewB.selectionBBox.start, viewB.selectionBBox.end);
            viewBObject.object = new THREE.Mesh(selectedB.geometry.clone(), viewB.room.material.clone());
            viewBObject.scene.add(viewBObject.object);
            viewBObject.transformControl.attach(viewBObject.object);

            aligning = true;
        });

        // Setting orientation of shared / aligned objects 
        var setOrientation = document.getElementById("setOrientation");
        setOrientation.addEventListener("click", function () {
            if (sharingA) {
                sharingA = false; 

                let yOrientation = Math.sign(viewAObject.object.rotation.y) *
                    viewAObject.object.quaternion.angleTo(new THREE.Quaternion());
                var sharedObjects = addShared(viewA, viewB, viewA.selectionBBox.start, viewA.selectionBBox.end, yOrientation);
                viewA.scene.add(sharedObjects.original);
                viewB.scene.add(sharedObjects.shared);
                objectPairs.push({
                    type: "shareA",
                    aStart: viewA.selectionBBox.start,
                    aEnd: viewA.selectionBBox.end,
                    aYOrientation: yOrientation,
                    bStart: null,
                    bEnd: null,
                    bYOrientation: null,
                    aObject: sharedObjects.original,
                    bObject: sharedObjects.shared,
                    sent: false
                });

                // Reset boundaries and selected object
                setSelectBBoxVisible(viewA.selectionBBox.boundaries, false);
                viewAObject.transformControl.detach();
                viewAObject.scene.remove(viewAObject.object);
                viewAObject.object = null;
            }
            if (sharingB) {
                sharingB = false; 

                let yOrientation = Math.sign(viewBObject.object.rotation.y) *
                    viewBObject.object.quaternion.angleTo(new THREE.Quaternion());
                var sharedObjects = addShared(viewB, viewA, viewB.selectionBBox.start, viewB.selectionBBox.end, yOrientation);
                viewB.scene.add(sharedObjects.original);
                viewA.scene.add(sharedObjects.shared);
                objectPairs.push({
                    type: "shareB",
                    aStart: null,
                    aEnd: null,
                    aYOrientation: null,
                    bStart: viewB.selectionBBox.start,
                    bEnd: viewB.selectionBBox.end,
                    bYOrientation: yOrientation,
                    aObject: sharedObjects.shared,
                    bObject: sharedObjects.original,
                    sent: false
                });

                // Reset boundaries and selected object
                setSelectBBoxVisible(viewB.selectionBBox.boundaries, false);
                viewBObject.transformControl.detach();
                viewBObject.scene.remove(viewBObject.object);
                viewBObject.object = null;
            }
            if (aligning) {
                aligning = false; 

                let aYOrientation = Math.sign(viewAObject.object.rotation.y) *
                    viewAObject.object.quaternion.angleTo(new THREE.Quaternion());
                let bYOrientation = Math.sign(viewBObject.object.rotation.y) *
                    viewBObject.object.quaternion.angleTo(new THREE.Quaternion());
                var alignedObjects = addAligned(viewA.selectionBBox.start, viewA.selectionBBox.end, aYOrientation,
                    viewB.selectionBBox.start, viewB.selectionBBox.end, bYOrientation);
                viewA.scene.add(alignedObjects.aObject);
                viewB.scene.add(alignedObjects.bObject);
                objectPairs.push({
                    type: "align",
                    aStart: viewA.selectionBBox.start,
                    aEnd: viewA.selectionBBox.end,
                    aYOrientation: aYOrientation,
                    bStart: viewB.selectionBBox.start,
                    bEnd: viewB.selectionBBox.end,
                    bYOrientation: bYOrientation,
                    aObject: alignedObjects.aObject,
                    bObject: alignedObjects.bObject,
                    sent: false
                });

                // Reset boundaries and selected object
                setSelectBBoxVisible(viewA.selectionBBox.boundaries, false);
                viewAObject.transformControl.detach();
                viewAObject.scene.remove(viewAObject.object);
                viewAObject.object = null;
                setSelectBBoxVisible(viewB.selectionBBox.boundaries, false);
                viewBObject.transformControl.detach();
                viewBObject.scene.remove(viewBObject.object);
                viewBObject.object = null;
            }
        });

        // Confirm anchors
        var confirm = document.getElementById("confirm");
        confirm.addEventListener("click", function () {
            Meteor.call("objectPairs.reset");
            let numPairs = objectPairs.length;
            for (let i = 0; i < numPairs; i++) {
                let objectPair = objectPairs[i];
                if (!objectPair.sent) {
                    if (objectPair.type == "shareA") {
                        let start = [], end = [], pos = [], rot = [];
                        objectPair.aStart.toArray(start);
                        objectPair.aEnd.toArray(end);
                        objectPair.bObject.position.toArray(pos);
                        objectPair.bObject.quaternion.toArray(rot);
                        Meteor.call("objectPairs.shareA", start, end, objectPair.aYOrientation, pos, rot);
                    }
                    if (objectPair.type == "shareB") {
                        let start = [], end = [], pos = [], rot = [];
                        objectPair.bStart.toArray(start);
                        objectPair.bEnd.toArray(end);
                        objectPair.aObject.position.toArray(pos);
                        objectPair.aObject.quaternion.toArray(rot);
                        Meteor.call("objectPairs.shareB", start, end, objectPair.bYOrientation, pos, rot);
                    }
                    if (objectPair.type == "align") {
                        let aStart = [], aEnd = [], bStart = [], bEnd = [];
                        objectPair.aStart.toArray(aStart);
                        objectPair.aEnd.toArray(aEnd);
                        objectPair.bStart.toArray(bStart);
                        objectPair.bEnd.toArray(bEnd);
                        Meteor.call("objectPairs.align", aStart, aEnd, objectPair.aYOrientation, bStart, bEnd, objectPair.bYOrientation);
                    }
                    objectPairs[i].sent = true;
                }
            }
            Meteor.call("alignment.reset");
            Meteor.call("alignment.set", numPairs);
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
        let btns = document.getElementsByClassName("button");
        let numBtns = btns.length;
        for (let i = 0; i < numBtns; i++) {
            btns[i].style.display = "inline-block";
        }
        document.getElementById("waitingMessage").style.display = "none";
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
    }
    

    window.onload = function () {
        resetDBs();
        initThree();
        initControls();
        sync();
    }
});
