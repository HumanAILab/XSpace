import './player.css';
import './player.html';

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import { Rooms } from '../../api/rooms.js';
import { Players } from "../../api/players.js";
import { Alignment } from "../../api/alignment.js";
import { Projectiles } from "../../api/projectiles.js";
import { RoomScans } from '../../api/roomScans';
import { SystemState } from "../../api/systemState.js";

import * as THREE from '../../lib/three/three.module.js';
import { GLTFLoader } from '../../lib/three/GLTFLoader.js';
import { SliceGeometry } from "../../lib/three/slice.js";
import { PointerLockControls } from "../../lib/three/PointerLockControls.js";
import { OBJLoader } from '../../lib/three/OBJLoader.js';
import { BufferGeometryUtils } from "../../lib/three/BufferGeometryUtils.js";

import { Random } from 'meteor/random';
import { RoomAColliders, RoomBColliders } from "./roomColliders.js";
import * as CANNON from '../../lib/cannon/cannon-es.js';

Template.App_player.onCreated(() => {


    // Canvas and Renderer 
    let canvas, renderer;

    // Views 
    let view = {
        viewport: null,
        scene: null,
        camera: null,
        room: new THREE.Mesh(),
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
            head: null,
            bodyBody: null,
            headBody: null
        },
        avatarPrevState: {
            position: new THREE.Vector3(),
            rotation: new THREE.Quaternion()
        },
        world: null,
        balls: []
    }

    // Room Meshes 
    let roomMeshes = [];

    // Colliders 
    let currColliders, remoteColliders;

    // Shared 
    // Information for defining shared region
    let shared = {
        defined: null,
        worldStart: null,
        worldEnd: null,
        roomA: null,
        roomB: null,
        mesh: null,
        boundaries: null
    }

    // Camera set-up parameters
    let camFirstParams = {
        fov: 60,
        near: 0.1,
        far: 100,
        position: new THREE.Vector3(0.0, 1.5, 0.0),
        lookAt: new THREE.Vector3(0.0, 1.5, -1.0)
    };

    // ROOM ID: 'A', 'B', 'C', etc...
    let playerWorldId = null;
    playerWorldId = FlowRouter.getParam("_id");

    let fileName = null;
    fileName = FlowRouter.getParam("_file")

    let playerClientId = Random.id();
    let playerCollectionId = null;

    // Remote players 
    let otherPlayers = [];

    // Projecitles 
    let ballShape = new CANNON.Sphere(0.1);
    let ballGeometry = new THREE.SphereGeometry(ballShape.radius, 32, 32);
    let ballMaterial = new THREE.MeshLambertMaterial({
        flatShading: true,
        color: 0xffffff
    });
    let fireVelocity = 7.5;

    // Update variables 
    let prevTime = performance.now();
    let physicsUpdateDelta = 0.0;

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
    let loadModelGLTF = function (source, color, opacity) {
        return new Promise(function (resolve) {
            let material = new THREE.MeshLambertMaterial({
                flatShading: true,
                side: THREE.DoubleSide, // THREE.BackSide
                color: color,
                opacity: 0.5,
                transparent: true
            });

            let loader = new GLTFLoader();

            loader.load(source, function (gltf) {
                console.log(gltf);
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
        let avatar = new THREE.Object3D();
        // Meshes
        let avatarHeadMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.25, 0.25),
            new THREE.MeshLambertMaterial({ color: color })
        );
        let avatarEyeLeft = new THREE.Mesh(
            new THREE.CircleBufferGeometry(0.05, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        avatarEyeLeft.position.set(-0.075, 0, 0.13);
        let avatarEyeRight = new THREE.Mesh(
            new THREE.CircleBufferGeometry(0.05, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        avatarEyeRight.position.set(0.075, 0, 0.13);
        let avatarPupilLeft = new THREE.Mesh(
            new THREE.CircleBufferGeometry(0.025, 32),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        avatarPupilLeft.position.set(-0.075, 0, 0.135);
        let avatarPupilRight = new THREE.Mesh(
            new THREE.CircleBufferGeometry(0.025, 32),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        avatarPupilRight.position.set(0.075, 0, 0.135);
        avatarHeadMesh.attach(avatarEyeLeft);
        avatarHeadMesh.attach(avatarEyeRight);
        avatarHeadMesh.attach(avatarPupilLeft);
        avatarHeadMesh.attach(avatarPupilRight);
        avatar.attach(avatarHeadMesh);
        let avatarBodyMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.5, 0.25),
            new THREE.MeshLambertMaterial({ color: color })
        );
        avatarBodyMesh.position.set(0.0, -0.5, 0.0);
        avatar.attach(avatarBodyMesh);

        // Cannon bodies 
        let headShape = new CANNON.Box(new CANNON.Vec3(0.125, 0.125, 0.125));
        let headBody = new CANNON.Body({ mass: 0 });
        headBody.addShape(headShape);
        let bodyShape = new CANNON.Box(new CANNON.Vec3(0.125, 0.25, 0.125));
        let bodyBody = new CANNON.Body({ mass: 0 });
        bodyBody.addShape(bodyShape);

        return {
            avatar: avatar,
            body: avatarBodyMesh,
            head: avatarHeadMesh,
            bodyBody: bodyBody,
            headBody: headBody
        };
    }

    // Defining boundaries
    function initBoundaries() {
        let boundaries = [];
        let numBounds = 4;
        let boundary;
        for (let i = 0; i < numBounds; i++) {
            boundary = new THREE.Mesh(
                new THREE.BoxGeometry(1.0, 2.0, 0.1),
                new THREE.MeshBasicMaterial({
                    side: THREE.DoubleSide, // THREE.BackSide
                    color: 0xffffff,
                    opacity: 0.25,
                    transparent: true
                })
            );
            boundary.position.y = 1.0;
            boundary.visible = true;
            boundaries.push(boundary);
        }
        return boundaries;
    }
    // Update hide boundaries
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
    // Update single boundary
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

    // Get shared space
    function getShared(remote, positionOffset, rotationOffset, start, end) {
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

        let remoteShared = remote.clone();

        console.log(remoteShared);
        // return remoteShared;
        // HL Testing: Comment out the return to crop the remote mesh

        let rotationOffsetEuler = new THREE.Euler().setFromQuaternion(rotationOffset);
        remoteShared.translate(positionOffset.x, positionOffset.y, positionOffset.z);
        remoteShared.rotateX(rotationOffsetEuler.x);
        remoteShared.rotateY(rotationOffsetEuler.y);
        remoteShared.rotateZ(rotationOffsetEuler.z);
        remoteShared = SliceGeometry(remoteShared, frontInv, false);
        remoteShared = SliceGeometry(remoteShared, backInv, false);
        remoteShared = SliceGeometry(remoteShared, leftInv, false);
        remoteShared = SliceGeometry(remoteShared, rightInv, false);
        remoteShared.translate(-positionOffset.x, -positionOffset.y, -positionOffset.z);
        remoteShared.rotateX(-rotationOffsetEuler.x);
        remoteShared.rotateY(-rotationOffsetEuler.y);
        remoteShared.rotateZ(-rotationOffsetEuler.z);

        return remoteShared;
    }

    // For loading remote shared region
    function loadShared() {
        console.log("called load shared");
        console.log(shared);
        console.log(roomMeshes.length);
        // Loading condition check 
        if (roomMeshes.length >= 2 &&
            shared.defined != null &&
            shared.roomA != null &&
            shared.roomB != null &&
            shared.mesh == null) {

            console.log("passed condition check");
            let remoteIdx, remote;
            remoteIdx = (playerWorldId == "A") ? 1 : 0;
            remote = (playerWorldId == "A") ? "B" : "A";
            console.log('remoteIDX ' + remoteIdx); // Jaylin testing

            let currPos = shared["room" + playerWorldId].position;
            let currRot = shared["room" + playerWorldId].rotation;
            let remotePos = shared["room" + remote].position;
            let remoteRot = shared["room" + remote].rotation;
            console.log(shared);
            console.log(view.room.position);

            // Mesh
            let remoteSharedGeometry = getShared(roomMeshes[remoteIdx].geometry, remotePos, remoteRot, shared.worldStart, shared.worldEnd);
            let remoteShared = new THREE.Mesh(remoteSharedGeometry, roomMeshes[remoteIdx].material.clone());

            let relativePosition = new THREE.Vector3().subVectors(remotePos, currPos);
            let relativeQuaternion = new THREE.Quaternion().multiplyQuaternions(remoteRot, currRot.clone().inverse());
            remoteShared.position.copy(relativePosition);
            remoteShared.quaternion.copy(relativeQuaternion);
            view.scene.add(remoteShared);
            shared.mesh = remoteShared;
            shared.mesh.material.opacity = 0.8;
            console.log(remoteSharedGeometry);
            console.log(remoteShared);

            return;
            // Comment out the above to make the boundaries visible to the player
            
            // Boundaries
            shared.boundaries = initBoundaries();
            for (let i = 0; i < shared.boundaries.length; i++) {
                view.scene.add(shared.boundaries[i]);
            }
            let localStart = shared.worldStart.clone().sub(currPos);
            let localEnd = shared.worldEnd.clone().sub(currPos);
            updateBoundaries(shared.boundaries, localStart, localEnd);

            // Setting up colliders 
            let remoteStart = shared.worldStart.clone().sub(remotePos);
            let remoteEnd = shared.worldEnd.clone().sub(remotePos);
            let remoteBBoxMin =
                new THREE.Vector3(Math.min(remoteStart.x, remoteEnd.x), -Infinity, Math.min(remoteStart.z, remoteEnd.z));
            let remoteBBoxMax =
                new THREE.Vector3(Math.max(remoteStart.x, remoteEnd.x), Infinity, Math.max(remoteStart.z, remoteEnd.z));
            let remoteBBox = new THREE.Box3(remoteBBoxMin, remoteBBoxMax);
            let extents, position;
            let collisionBox, collisionBoxStart, collisionBoxEnd, collisionBoxMin, collisionBoxMax;
            let collisionExtents = new THREE.Vector3();
            let collisionPosition = new THREE.Vector3();
            let boxShape, boxBody;
            for (let i = 0; i < currColliders.length; i++) {
                extents = remoteColliders[i].extents;
                position = remoteColliders[i].position;
                collisionBoxStart = extents.clone().multiplyScalar(-0.5).add(position);
                collisionBoxEnd = extents.clone().multiplyScalar(0.5).add(position);
                collisionBoxMin = new THREE.Vector3(
                    Math.min(collisionBoxStart.x, collisionBoxEnd.x),
                    Math.min(collisionBoxStart.y, collisionBoxEnd.y),
                    Math.min(collisionBoxStart.z, collisionBoxEnd.z)
                );
                collisionBoxMax = new THREE.Vector3(
                    Math.max(collisionBoxStart.x, collisionBoxEnd.x),
                    Math.max(collisionBoxStart.y, collisionBoxEnd.y),
                    Math.max(collisionBoxStart.z, collisionBoxEnd.z)
                );
                collisionBox = new THREE.Box3(collisionBoxMin, collisionBoxMax);
                if (collisionBox.intersectsBox(remoteBBox)) {
                    collisionBox.intersect(remoteBBox);
                    collisionBox.min.add(relativePosition);
                    collisionBox.max.add(relativePosition);
                    collisionBox.getCenter(collisionPosition);
                    collisionBox.getSize(collisionExtents);

                    boxShape = new CANNON.Box(
                        new CANNON.Vec3(0.5 * collisionExtents.x, 0.5 * collisionExtents.y, 0.5 * collisionExtents.z)
                    );
                    boxBody = new CANNON.Body({ mass: 0 });
                    boxBody.addShape(boxShape);
                    view.world.addBody(boxBody);
                    boxBody.position.copy(collisionPosition);
                }
            }

            render();
        }
    }

    // Setting up the canvas, renderer, viewport, 
    // camera, scenes, lighting, room, character avatar
    function initThree() {
        // Canvas & Renderer
        canvas = document.getElementById("cPlayer");
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        // Views
        view.viewport = document.getElementById("viewFirstPlayer");

        // Scenes
        view.scene = new THREE.Scene();
        view.scene.background = new THREE.Color(0xdedede);

        // Lighting 
        lightScene(view.scene);

        // Cameras 
        view.camera = newCamera(camFirstParams, view.viewport);
        view.scene.add(view.camera);

        // Room 
        // playerWorldId dependent
        view.scene.add(view.room);

        // Room Opacity:
        let opacityA = (playerWorldId == "A") ? 0.5 : 0.8;
        let opacityB = (playerWorldId == "B") ? 0.5 : 0.8;

        Promise.all([
            loadModelGLTF("/roomA.gltf", 0xcfe2f3, opacityA),
            loadModelGLTF("/roomB.gltf", 0xffe599, opacityB)
            //loadModelGLTF("/roomC/scene.gltf", 0xffe599, opacityB)
            //loadModelGLTF("/roomD.glb", 0xffe599, opacityB)
        ]).then(result => {
            roomMeshes.push(result[0]);
            roomMeshes.push(result[1]);

            // Room mesh 
            let roomIdx;
            roomIdx = (playerWorldId == "A") ? 0 : 1;
            view.room.geometry = roomMeshes[roomIdx].geometry.clone();
            view.room.material = roomMeshes[roomIdx].material.clone();
            // view.room.material.opacity = 1.0;

            // Setting up collision boxes 
            if (playerWorldId == "A") {
                currColliders = RoomAColliders;
                remoteColliders = RoomBColliders;
            } else {
                currColliders = RoomBColliders;
                remoteColliders = RoomAColliders;
            }
            let extents, position;
            let boxShape, boxBody;
            for (let i = 0; i < currColliders.length; i++) {
                extents = currColliders[i].extents;
                position = currColliders[i].position;
                boxShape = new CANNON.Box(
                    new CANNON.Vec3(0.5 * extents.x, 0.5 * extents.y, 0.5 * extents.z)
                );
                boxBody = new CANNON.Body({ mass: 0 });
                boxBody.addShape(boxShape);
                view.world.addBody(boxBody);
                boxBody.position.copy(position);
            }

            loadShared();

            render();
        });

        render();
    }

    // Set up physics using cannon.js
    function initCannon() {
        view.world = new CANNON.World();
        view.world.gravity.set(0.0, -9.8, 0.0);
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
            } else {
                fire();
            }
        });
        view.pointerLock.addEventListener("unlock", function (event) {
            document.removeEventListener("keydown", wasdDown);
            document.removeEventListener("keyup", wasdUp);
        });
    }

    Template.App_player.events({
        'submit #new-text': function(event) {
            event.preventDefault();
            text = $('textarea').val();
            console.log(text);

            addNameTag(view.avatar.body, text);
            Meteor.call('players.name', playerCollectionId, text);
            $('#myModal').css("display", "none");
        }
    });

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

    // Handling player movement 
    // Note: This purely has to do with updating the pointerlock controller position
    function movePlayer(delta) {
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

    // Handling player avatar updates
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

    // Update avatar cannon.js bodies: For physics caluclations 
    function updateAvatarCannonBodies(avatar) {
        let newPlayerHeadPosition = new THREE.Vector3();
        let newPlayerHeadQuaternion = new THREE.Quaternion();
        avatar.head.getWorldPosition(newPlayerHeadPosition);
        avatar.head.getWorldQuaternion(newPlayerHeadQuaternion);
        avatar.headBody.position.copy(newPlayerHeadPosition);
        avatar.headBody.quaternion.copy(newPlayerHeadQuaternion);
        let newPlayerBodyPosition = new THREE.Vector3();
        let newPlayerBodyQuaternion = new THREE.Quaternion();
        avatar.body.getWorldPosition(newPlayerBodyPosition);
        avatar.body.getWorldQuaternion(newPlayerBodyQuaternion);
        avatar.bodyBody.position.copy(newPlayerBodyPosition);
        avatar.bodyBody.quaternion.copy(newPlayerBodyQuaternion);
    }

    // Firing projectiles 
    // Inserts a projectile entry in the server projectiles collection
    // The actual instantiation of the projectile mesh and projectile body takes place after the insertion is detected 
    function fire() {
        let fireDirection = new THREE.Vector3();
        view.pointerLock.getDirection(fireDirection);
        let firePosition = view.avatar.avatar.position.clone().add(fireDirection.clone().multiplyScalar(0.5));

        let fireDirectionArray = [];
        let firePositionArray = [];
        fireDirection.toArray(fireDirectionArray);
        firePosition.toArray(firePositionArray);

        Meteor.call("projectiles.insert", playerWorldId, firePositionArray, fireDirectionArray);
    }

    // Updating projectiles 
    // Copy location from physics engine to three.js 
    function updateProjectiles() {
        for (let i = 0; i < view.balls.length; i++) {
            let currBall = view.balls[i];
            currBall.mesh.position.copy(currBall.body.position);
        }
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

        // Sorry this is ugly, but we only want this to happen the first time!
        if (roomMeshes[0].name != "scans") {
            view.scene.remove(roomMeshes[0]);
            roomMeshes[0] = new THREE.Object3D();
            roomMeshes[0].name = "scans";
        }
        
        roomMeshes[0].add(object);
    }

    function meshImportDone(id) {
        console.log("mesh import done");

        let newMaterial = new THREE.MeshLambertMaterial({
            flatShading: true,
            side: THREE.BackSide,
            color: 0xcfe2f3
        });
    
        let parent = roomMeshes[0];
        let geometries = [];
        console.log("MESH IMPORT DONE CHILDREN LENGTH");
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
            color: 0xcfe2f3,
            opacity: 0.75,
            transparent: true
        });
        let compositeObj = new THREE.Mesh(
            mergedGeom,
            compositeMaterial
        );
        
        roomMeshes[0] = compositeObj;
        // view.scene.add(roomMeshes[0]);

        return mergedObject;
        // viewBuild.transformables.push(viewBuild.roomA); No transformables in this scene
    }

    // Sync with server
    function sync() {

        Meteor.subscribe('alignment');
        let alignmentUpdates = Alignment.find({});
        alignmentUpdates.observeChanges({
            added: function (docId, newDoc) {
                console.log("Alignment added");
                if (newDoc.shared) {
                    shared.defined = newDoc.shared;
                    shared.worldStart = new THREE.Vector3().fromArray(newDoc.sharedStart);
                    shared.worldEnd = new THREE.Vector3().fromArray(newDoc.sharedEnd);
                    loadShared();
                }
            },
            changed: function (docId, newDoc) {
                console.log("Alignment changed");
                if (newDoc.shared) {
                    shared.defined = newDoc.shared;
                    shared.worldStart = new THREE.Vector3().fromArray(newDoc.sharedStart);
                    shared.worldEnd = new THREE.Vector3().fromArray(newDoc.sharedEnd);
                    loadShared();
                }
            }
        });

        // Rooms 
        Meteor.subscribe("rooms");

        let roomAUpdates = Rooms.find({ id: "A" });
        roomAUpdates.observeChanges({
            added: function (docId, newDoc) {
                console.log('roomA added');
                console.log(newDoc);
                shared.roomA = {
                    position: new THREE.Vector3().fromArray(newDoc.position),
                    rotation: new THREE.Quaternion().fromArray(newDoc.rotation)
                };

                // Check if scan was already completed/ saved in DB:
                if (newDoc.done) {
                    meshImportDone(newDoc.id);
                }

                loadShared();
            },
            changed: function (docId, newDoc) {
                // Check if scan complete:
                if (newDoc.done) {
                    meshImportDone("A");
                    shared.roomA.position = new THREE.Vector3(0, 0, 0);
                }

                console.log("Room changed");
                if (newDoc.position) {
                    shared.roomA.position =  new THREE.Vector3().fromArray(newDoc.position);
                }
                if (newDoc.rotation) {
                    shared.roomA.rotation =  new THREE.Vector3().fromArray(newDoc.rotation);
                }
            }
        });
        let roomBUpdates = Rooms.find({ id: "B" });
        roomBUpdates.observeChanges({
            added: function (docId, newDoc) {
                console.log('roomB added');
                shared.roomB = {
                    position: new THREE.Vector3().fromArray(newDoc.position),
                    rotation: new THREE.Quaternion().fromArray(newDoc.rotation)
                };
                loadShared();
            },
            changed: function (docId, newDoc) {
                console.log("Room changed");
                if (newDoc.position) {
                    shared.roomB.position =  new THREE.Vector3().fromArray(newDoc.position);
                }
                if (newDoc.rotation) {
                    shared.roomB.rotation =  new THREE.Vector3().fromArray(newDoc.rotation);
                }
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
        // Data related to both local and remote players 
        Meteor.subscribe("players");
        let playersUpdates = Players.find({});
        playersUpdates.observeChanges({
            added: function (docId, newDoc) {
                let newPlayerColor = newDoc.color;
                let newPlayer = newAvatar(newPlayerColor);
                newPlayer.avatar.position.fromArray(newDoc.position);

                if (!newDoc.isHL) {
                    newPlayer.head.quaternion.fromArray(newDoc.rotation); 
                }
                else {
                    let r = newDoc.rotation;
                    newPlayer.head.rotation.set(r[0], r[1], r[2], 'YXZ'); // TODO: are these coordinates correct?
                    // TODO: They won't be if the space itself is rotated!
                }

                view.scene.add(newPlayer.avatar);
                view.world.addBody(newPlayer.headBody);
                view.world.addBody(newPlayer.bodyBody);
                updateAvatarCannonBodies(newPlayer);

                if (playerClientId == newDoc.clientId) {
                    console.log("This Player");
                    playerCollectionId = docId;
                    view.avatar = newPlayer;
                    view.avatarPrevState.position.copy(view.avatar.avatar.position);
                    view.avatarPrevState.rotation.copy(view.avatar.head.quaternion);
                } else {
                    console.log("Other Players");
                    otherPlayers.push({
                        collectionId: docId,
                        clientId: newDoc.clientId,
                        worldId: newDoc.worldId,
                        avatar: newPlayer
                    });
                }
                render();
            },
            changed: function (docId, newDoc) {
                let updates = otherPlayers.filter(function (avatar) {
                    return avatar.collectionId == docId;
                });
                if (updates.length > 0) {
                    let updatedPlayer = updates[0];
                    let p = newDoc.position;
                    if (p) {
                        updatedPlayer.avatar.avatar.position.fromArray(p)
                        if (updatedPlayer.worldId != playerWorldId) {
                            let remote = (playerWorldId == "A") ? "B" : "A";
                            let relativePos =
                                new THREE.Vector3().subVectors(
                                    shared["room" + remote].position,
                                    shared["room" + playerWorldId].position
                                );
                            updatedPlayer.avatar.avatar.position.add(relativePos);
                        }

                    }

                    let r = newDoc.rotation;
                    if (r) {
                        if (r.length == 3) {
                            updatedPlayer.avatar.head.rotation.set(r[0], r[1], r[2], 'YXZ');
                        }
                        else {
                            updatedPlayer.avatar.head.quaternion.fromArray(r);
                        }
                    }
                    
                    updateAvatarCannonBodies(updatedPlayer.avatar);

                    let name = newDoc.name;
                    if (name) {
                        addNameTag(updatedPlayer.avatar.body, name);
                    }

                    render();
                }
            }
        });

        // Projectiles
        // Data related to firing snowballs 
        Meteor.subscribe("projectiles");
        let projectilesUpdates = Projectiles.find({});
        projectilesUpdates.observeChanges({
            added: function (docId, newDoc) {
                let firePosition = new THREE.Vector3().fromArray(newDoc.position);
                let fireDirection = new THREE.Vector3().fromArray(newDoc.direction);


                let ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
                view.scene.add(ballMesh);

                let ballBody = new CANNON.Body({ mass: 1 });
                ballBody.addShape(ballShape);
                view.world.addBody(ballBody);

                if (newDoc.world != playerWorldId) {
                    let remote = (playerWorldId == "A") ? "B" : "A";
                    let relativePos =
                        new THREE.Vector3().subVectors(
                            shared["room" + remote].position,
                            shared["room" + playerWorldId].position
                        );
                    firePosition.add(relativePos);
                }


                ballMesh.position.copy(firePosition);
                ballBody.position.copy(firePosition);

                ballBody.velocity.set(
                    fireDirection.x * fireVelocity,
                    fireDirection.y * fireVelocity,
                    fireDirection.z * fireVelocity
                );

                view.balls.push({
                    mesh: ballMesh,
                    body: ballBody
                });
            }
        })
    }
    // Add player to server Players Collection 
    function initLocalPlayer() {
        // Player avatar
        let pos = [];
        let rot = [];
        view.camera.position.toArray(pos);
        let initQuaternion = new THREE.Quaternion();
        initQuaternion.toArray(rot);
        Meteor.call("players.insert", playerClientId, playerWorldId, false, pos, rot);
        Meteor.call("systemState.update", playerWorldId, true, true, "");
    }
    // Update players in server Player Collection 
    function serverUpdatePlayer() {
        if (playerCollectionId != null) {
            if (view.avatarPrevState.position.distanceTo(view.avatar.avatar.position) > 0.2) {
                let pos = [];
                view.avatar.avatar.position.toArray(pos);
                Meteor.call("players.move", playerCollectionId, pos);
                view.avatarPrevState.position.copy(view.avatar.avatar.position);
            }

            if (view.avatarPrevState.rotation.angleTo(view.avatar.head.quaternion) > 0.05) {

                //let rot = [view.avatar.head.rotation.x, view.avatar.head.rotation.y, view.avatar.head.rotation.z];
                let rot = [];
                view.avatar.head.quaternion.toArray(rot);
                Meteor.call("players.rotate", playerCollectionId, rot);
                view.avatarPrevState.rotation.copy(view.avatar.head.quaternion);
            }
        }
    }

    // Update loop 
    function update() {
        requestAnimationFrame(update);

        let time = performance.now();
        let delta = (time - prevTime) / 1000;
        physicsUpdateDelta += delta;

        if (physicsUpdateDelta >= (1.0 / 30.0)) {
            // Update physics 
            view.world.step(1.0 / 30.0);
            physicsUpdateDelta = 0.0;
        }

        // Update player 
        movePlayer(delta);
        updateAvatar();
        serverUpdatePlayer();

        // Update projectiles 
        updateProjectiles();

        render();

        prevTime = time;
    }

    window.onload = function () {
        sync();
        initThree();
        initCannon();
        initControls();
        initLocalPlayer();

        update();
    }
});