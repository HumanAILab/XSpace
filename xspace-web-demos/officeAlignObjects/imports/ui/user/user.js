import "./user.css";
import "./user.html";

import { Users } from '../../api/users.js';
import { Alignment } from "../../api/alignment.js";
import { ObjectPairs } from "../../api/objectPairs.js";

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import * as THREE from '../../lib/three/three.module.js';
import { GLTFLoader } from '../../lib/three/GLTFLoader.js';
import { PointerLockControls } from "../../lib/three/PointerLockControls.js";
import { SliceGeometry } from "../../lib/three/slice.js";

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
        room: new THREE.Mesh()
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

    // For alignment 
    let alignConditions = {
        aligned: false,
        totalPairs: 0,
        currPairs: 0
    };
    let objectPairs = [];  
    let localPairedObjects = [];
    let remotePairedObjects = []; 
    var remoteAlignmentParams = {
        onePair: {
            mapping: null
        },
        twoPairs: {
            translationMapping: null,
            rotationMapping: null
        },
        threePairs: {
            remoteDir0: null,
            remoteDir1: null,
            remoteDir2: null,
            rotationMapping0: null,
            rotationMapping1: null,
            rotationMapping2: null,
            barycentric: {
                a: null,
                v0: null,
                v1: null,
                d00: null,
                d01: null,
                d11: null,
                denom: null,
                anchor0: null,
                anchor1: null,
                anchor2: null
            }
        }
    }

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

        // Cameras
        view.camera = newCamera(camFirstParams, view.viewport);
        view.scene.add(view.camera);

        // Room Meshes
        // Currently hard-coded for room A and B (TODO)
        view.scene.add(view.room);
        Promise.all([
            loadModelGLTF("../roomA.gltf", 0xcfe2f3),
            loadModelGLTF("../roomB.gltf", 0xffe599)
        ]).then(result => {
            roomMeshes.push(result[0]);
            roomMeshes.push(result[1]);
            
            let roomIdx;
            roomIdx = (userWorldId == "A") ? 0 : 1;
            view.room.geometry = roomMeshes[roomIdx].geometry.clone();
            view.room.material = roomMeshes[roomIdx].material.clone();
            
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

    // Checking alignment conditions 
    function checkAlignmentConditions() {
        if (!alignConditions.aligned) return false;
        console.log("curr pairs: " + alignConditions.currPairs + " total pairs: " + alignConditions.totalPairs);
        if (alignConditions.currPairs != alignConditions.totalPairs) return false;
        alignmentConditionsMet();
        return true; 
    }
    function alignmentConditionsMet() {
        console.log("Alignment conditions met!");
        // Set alignment parameters
        if (alignConditions.currPairs == 1) {
            setRemoteAlignmentParamsOnePair(localPairedObjects, remotePairedObjects);
        } else if (alignConditions.currPairs == 2) {
            setRemoteAlignmentParamsTwoPairs(localPairedObjects, remotePairedObjects);
        } else if (alignConditions.currPairs == 3) {
            setRemoteAlignmentParamsThreePairs(localPairedObjects, remotePairedObjects);
        }
    }
    // Place the remote avatar in an appropriate position 
    function calcAlignedPosition(remotePosition) {
        if (alignConditions.currPairs == 1) {
            remotePosition.applyMatrix4(remoteAlignmentParams.onePair.mapping);
        } else if (alignConditions.currPairs == 2) {
            remotePosition.applyMatrix4(remoteAlignmentParams.twoPairs.translationMapping);
        } else if (alignConditions.currPairs == 3) {
            let barycentric = getBarycentric(remotePosition);
            remotePosition.set(0, 0, 0);
            remotePosition.add(new THREE.Vector3().copy(remoteAlignmentParams.threePairs.barycentric.anchor0).multiplyScalar(barycentric.x));
            remotePosition.add(new THREE.Vector3().copy(remoteAlignmentParams.threePairs.barycentric.anchor1).multiplyScalar(barycentric.y));
            remotePosition.add(new THREE.Vector3().copy(remoteAlignmentParams.threePairs.barycentric.anchor2).multiplyScalar(barycentric.z));
        }
        remotePosition.y = 1.5;
        return remotePosition;
    }
    // Set the head rotation of the remote avatar
    function calcAlignedHeadRotation(remoteHeadQuaternion) {
        if (alignConditions.currPairs == 1) {
            remoteHeadQuaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(remoteAlignmentParams.onePair.mapping));
        } else if (alignConditions.currPairs == 2) {
            remoteHeadQuaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(remoteAlignmentParams.twoPairs.rotationMapping));
        } else if (alignConditions.currPairs == 3) {
            let forwardDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(remoteHeadQuaternion);
            forwardDirection.normalize();
            let d0 = forwardDirection.dot(remoteAlignmentParams.threePairs.remoteDir0);
            let d1 = forwardDirection.dot(remoteAlignmentParams.threePairs.remoteDir1);
            let d2 = forwardDirection.dot(remoteAlignmentParams.threePairs.remoteDir2);
            if (d0 > d1 && d0 > d2) {
                remoteHeadQuaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(remoteAlignmentParams.threePairs.rotationMapping0));
            } else if (d1 > d0 && d1 > d2) {
                remoteHeadQuaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(remoteAlignmentParams.threePairs.rotationMapping1));
            } else {
                remoteHeadQuaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(remoteAlignmentParams.threePairs.rotationMapping2));
            }
        }
        return remoteHeadQuaternion;
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
    function addShared(room, startArray, endArray, yOrientation, positionArray, rotationArray) {
        var start = new THREE.Vector3().fromArray(startArray);
        var end = new THREE.Vector3().fromArray(endArray);
        var originalObject = extractSelected(room, start, end);
        originalObject.geometry.rotateY(yOrientation);
        originalObject.rotateY(-yOrientation);
        var sharedObject = new THREE.Mesh(originalObject.geometry.clone(), originalObject.material.clone());
        originalObject.scale.set(1.05, 1.05, 1.05); // Scale original geometry for overlay 
        sharedObject.position.fromArray(positionArray);
        sharedObject.quaternion.fromArray(rotationArray);
        return { original: originalObject, shared: sharedObject };
    }

    // Adding Aligned Objects 
    function addAligned(aStartArray, aEndArray, aYOrientation, bStartArray, bEndArray, bYOrientation) {
        var aStart = new THREE.Vector3().fromArray(aStartArray);
        var aEnd = new THREE.Vector3().fromArray(aEndArray);
        var aObject = extractSelected(roomMeshes[0], aStart, aEnd);
        aObject.geometry.rotateY(aYOrientation);
        aObject.rotateY(-aYOrientation);
        aObject.scale.set(1.05, 1.05, 1.05);

        var bStart = new THREE.Vector3().fromArray(bStartArray);
        var bEnd = new THREE.Vector3().fromArray(bEndArray);
        var bObject = extractSelected(roomMeshes[1], bStart, bEnd);
        bObject.geometry.rotateY(bYOrientation);
        bObject.rotateY(-bYOrientation);
        bObject.scale.set(1.05, 1.05, 1.05);

        return {
            aObject: aObject,
            bObject: bObject
        }
    }

    // Calculating mapping from one pair of aligned objects 
    function setRemoteAlignmentParamsOnePair(currPairedObjects, remotePairedObjects) {
        let currPosition = currPairedObjects[0].position.clone();
        let currRotation = new THREE.Quaternion().setFromEuler(currPairedObjects[0].rotation);
        let remotePosition = remotePairedObjects[0].position.clone();
        let remoteRotation = new THREE.Quaternion().setFromEuler(remotePairedObjects[0].rotation);
        let currObjMatrix = new THREE.Matrix4().compose(currPosition, currRotation, new THREE.Vector3(1, 1, 1));
        let remoteObjMatrix = new THREE.Matrix4().compose(remotePosition, remoteRotation, new THREE.Vector3(1, 1, 1));
        remoteAlignmentParams.onePair.mapping = new THREE.Matrix4().identity();
        remoteAlignmentParams.onePair.mapping.premultiply(new THREE.Matrix4().getInverse(remoteObjMatrix));
        remoteAlignmentParams.onePair.mapping.premultiply(currObjMatrix);
    }

    // Calculating mapping from two pairs of aligned objects 
    function setRemoteAlignmentParamsTwoPairs(currPairedObjects, remotePairedObjects) {
        // Calculating mapping from two pairs of aligned objects 
        let curr0 = currPairedObjects[0].position.clone();
        curr0.y = 0.0;
        let curr1 = currPairedObjects[1].position.clone();
        curr1.y = 0.0;
        let curr0curr1 = new THREE.Vector3().subVectors(curr1, curr0);
        curr0curr1.y = 0.0;

        let remote0 = remotePairedObjects[0].position.clone();
        remote0.y = 0.0;
        let remote1 = remotePairedObjects[1].position.clone();
        remote1.y = 0.0;
        let remote0remote1 = new THREE.Vector3().subVectors(remote1, remote0);
        remote0remote1.y = 0.0;

        let remoteCurrScale = curr0curr1.length() / remote0remote1.length();

        curr0curr1.normalize();
        remote0remote1.normalize();

        // Rotation mapping 
        remoteAlignmentParams.twoPairs.rotationMapping = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(remote0remote1, curr0curr1));

        // Translation mapping 
        let translationMapping = new THREE.Matrix4().identity();
        translationMapping.premultiply(new THREE.Matrix4().makeTranslation(-remote0.x, 0.0, -remote0.z));
        translationMapping.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(remote0remote1, new THREE.Vector3(0, 0, 1))));
        translationMapping.premultiply(new THREE.Matrix4().makeScale(remoteCurrScale, 1.0, remoteCurrScale));
        translationMapping.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), curr0curr1)));
        translationMapping.premultiply(new THREE.Matrix4().makeTranslation(curr0.x, 0.0, curr0.z));
        remoteAlignmentParams.twoPairs.translationMapping = translationMapping;
    }

    // Calculating mapping from three pairs of aligned objects 
    function setRemoteAlignmentParamsThreePairs(currPairedObjects, remotePairedObjects) {
        // Current aligned object directions 
        let currCenter = new THREE.Vector3().add(currPairedObjects[0].position).add(currPairedObjects[1].position).add(currPairedObjects[2].position);
        currCenter.multiplyScalar(1.0 / 3.0);
        let currDir0 = new THREE.Vector3().subVectors(currPairedObjects[0].position, currCenter);
        currDir0.y = 0.0;
        currDir0.normalize();
        let currDir1 = new THREE.Vector3().subVectors(currPairedObjects[1].position, currCenter);
        currDir1.y = 0.0;
        currDir1.normalize();
        let currDir2 = new THREE.Vector3().subVectors(currPairedObjects[2].position, currCenter);
        currDir2.y = 0.0;
        currDir2.normalize();

        // Remote aligned object directions 
        let remoteCenter = new THREE.Vector3().add(remotePairedObjects[0].position).add(remotePairedObjects[1].position).add(remotePairedObjects[2].position);
        remoteCenter.multiplyScalar(1.0 / 3.0);
        let remoteDir0 = new THREE.Vector3().subVectors(remotePairedObjects[0].position, remoteCenter);
        remoteDir0.y = 0.0;
        remoteDir0.normalize();
        let remoteDir1 = new THREE.Vector3().subVectors(remotePairedObjects[1].position, remoteCenter);
        remoteDir1.y = 0.0;
        remoteDir1.normalize();
        let remoteDir2 = new THREE.Vector3().subVectors(remotePairedObjects[2].position, remoteCenter);
        remoteDir2.y = 0.0;
        remoteDir2.normalize();

        // Rotation mappings 
        remoteAlignmentParams.threePairs.remoteDir0 = remoteDir0;
        remoteAlignmentParams.threePairs.remoteDir1 = remoteDir1;
        remoteAlignmentParams.threePairs.remoteDir2 = remoteDir2;
        remoteAlignmentParams.threePairs.rotationMapping0 = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(remoteDir0, currDir0));
        remoteAlignmentParams.threePairs.rotationMapping1 = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(remoteDir1, currDir1));
        remoteAlignmentParams.threePairs.rotationMapping2 = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(remoteDir2, currDir2));

        // Pre-calculate some barycentric parameters 
        let a = remotePairedObjects[0].position.clone();
        a.y = 0.0;
        let b = remotePairedObjects[1].position.clone();
        b.y = 0.0;
        let c = remotePairedObjects[2].position.clone();
        c.y = 0.0;
        let v0 = new THREE.Vector3().subVectors(b, a);
        let v1 = new THREE.Vector3().subVectors(c, a);
        let d00 = v0.dot(v0);
        let d01 = v0.dot(v1);
        let d11 = v1.dot(v1);
        let denom = d00 * d11 - d01 * d01;
        remoteAlignmentParams.threePairs.barycentric.a = a;
        remoteAlignmentParams.threePairs.barycentric.v0 = v0;
        remoteAlignmentParams.threePairs.barycentric.v1 = v1;
        remoteAlignmentParams.threePairs.barycentric.d00 = d00;
        remoteAlignmentParams.threePairs.barycentric.d01 = d01;
        remoteAlignmentParams.threePairs.barycentric.d11 = d11;
        remoteAlignmentParams.threePairs.barycentric.denom = denom;
        remoteAlignmentParams.threePairs.barycentric.anchor0 = currPairedObjects[0].position.clone();
        remoteAlignmentParams.threePairs.barycentric.anchor1 = currPairedObjects[1].position.clone();
        remoteAlignmentParams.threePairs.barycentric.anchor2 = currPairedObjects[2].position.clone();
    }

    // Getting barycentric coordinates 
    function getBarycentric(p) {
        let v2 = new THREE.Vector3().subVectors(p, remoteAlignmentParams.threePairs.barycentric.a);
        let d20 = v2.dot(remoteAlignmentParams.threePairs.barycentric.v0);
        let d21 = v2.dot(remoteAlignmentParams.threePairs.barycentric.v1);

        let v = (remoteAlignmentParams.threePairs.barycentric.d11 * d20 - remoteAlignmentParams.threePairs.barycentric.d01 * d21) / remoteAlignmentParams.threePairs.barycentric.denom;
        let w = (remoteAlignmentParams.threePairs.barycentric.d00 * d21 - remoteAlignmentParams.threePairs.barycentric.d01 * d20) / remoteAlignmentParams.threePairs.barycentric.denom;
        let u = 1.0 - v - w;

        return new THREE.Vector3(u, v, w);
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
                
                view.scene.add(newUser.avatar);

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
                        let avatarPos = new THREE.Vector3().fromArray(p);
                        if (updatedUser.worldId != userWorldId) {
                            avatarPos = calcAlignedPosition(avatarPos);
                        }
                        updatedUser.avatar.avatar.position.copy(avatarPos);
                    }
                    let r = newDoc.rotation;
                    if (r) {
                        let avatarRot = new THREE.Quaternion().fromArray(r);
                        if (updatedUser.worldId != userWorldId) {
                            avatarRot = calcAlignedHeadRotation(avatarRot.clone());
                        }
                        updatedUser.avatar.head.quaternion.copy(avatarRot);
                    }

                    render();
                }
            }
        });

        // Alignment 
        Meteor.subscribe("alignment");
        let alignmentUpdates = Alignment.find({});
        alignmentUpdates.observeChanges({
            added: function (docId, newDoc) {
                console.log("Alignment added");
                alignConditions.aligned = true;
                alignConditions.totalPairs = newDoc.numPairs;
                checkAlignmentConditions();
            },
            removed: function (docId) {
                /*
                console.log("Alignment Removed");
                alignConditions.aligned = false;
                checkAlignmentConditions();
                */
            }
        });

        // Object Pairs 
        Meteor.subscribe("objectPairs");
        let objectPairsUpdates = ObjectPairs.find({});
        objectPairsUpdates.observeChanges({
            added: function (docId, newDoc) {
                console.log("Object pair added");
                if (newDoc.type == "shareA") {
                    var sharedObjects = addShared(roomMeshes[0], newDoc.aStart, newDoc.aEnd, newDoc.aYOrientation, newDoc.bPosition, newDoc.bRotation);
                    let localObject, remoteObject; 
                    if (userWorldId == "A") {
                        localObject = sharedObjects.original;
                        remoteObject = sharedObjects.shared;
                    } else {
                        localObject = sharedObjects.shared;
                        remoteObject = sharedObjects.original;
                    }
                    view.scene.add(localObject);
                    localPairedObjects.push(localObject);
                    remotePairedObjects.push(remoteObject);
                    objectPairs.push({
                        "id": docId,
                        "local": localObject,
                        "remote": remoteObject
                    });
                }
                if (newDoc.type == "shareB") {
                    var sharedObjects = addShared(roomMeshes[1], newDoc.bStart, newDoc.bEnd, newDoc.bYOrientation, newDoc.aPosition, newDoc.aRotation);
                    let localObject, remoteObject; 
                    if (userWorldId == "A") {
                        localObject = sharedObjects.shared;
                        remoteObject = sharedObjects.original;
                    } else {
                        localObject = sharedObjects.original;
                        remoteObject = sharedObjects.shared;
                    }
                    view.scene.add(localObject);
                    localPairedObjects.push(localObject);
                    remotePairedObjects.push(remoteObject);
                    objectPairs.push({
                        "id": docId,
                        "local": localObject,
                        "remote": remoteObject
                    });
                }
                if (newDoc.type == "align") {
                    var alignedObjects = addAligned(newDoc.aStart, newDoc.aEnd, newDoc.aYOrientation, newDoc.bStart, newDoc.bEnd, newDoc.bYOrientation);
                    let localObject, remoteObject;
                    if (userWorldId == "A") {
                        localObject = alignedObjects.aObject;
                        remoteObject = alignedObjects.bObject;
                    } else {
                        localObject = alignedObjects.bObject;
                        remoteObject = alignedObjects.aObject;
                    }
                    view.scene.add(localObject);
                    localPairedObjects.push(localObject);
                    remotePairedObjects.push(remoteObject);
                    objectPairs.push({
                        "id": docId,
                        "local": localObject,
                        "remote": remoteObject
                    });
                }

                alignConditions.currPairs = objectPairs.length;
                checkAlignmentConditions();
            },
            removed: function (docId) {
                /*
                console.log("Object pair removed");
                // Get objectPair entry 
                let objectPair = objectPairs.find(pair => pair.id == docId);
                view.scene.remove(objectPair.local);

                localPairedObjects.splice(localPairedObjects.indexOf(objectPair.local));
                remotePairedObjects.splice(remotePairedObjects.indexOf(objectPair.remote));
                objectPairs.splice(objectPairs.indexOf(objectPair));

                alignConditions.currPairs = objectPairs.length;
                checkAlignmentConditions();
                */
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