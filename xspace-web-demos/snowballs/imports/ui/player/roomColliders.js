import * as THREE from '../../lib/three/three.module.js';

var roomA = [
        {
          extents: new THREE.Vector3(0.1, 2.0, 4.4),
          position: new THREE.Vector3(0.8, 1.0, 1.4)
        },
        {
          extents: new THREE.Vector3(3.4, 2.0, 0.1),
          position: new THREE.Vector3(-0.9, 1.0, 3.6)
        },
        {
          extents: new THREE.Vector3(0.1, 2.0, 7.3),
          position: new THREE.Vector3(-2.6,1.0,-0.05)
        },
        {
          extents: new THREE.Vector3(4.5, 2.0, 0.1),
          position: new THREE.Vector3(-0.35, 1.0, -3.7)
        },
        {
          extents: new THREE.Vector3(0.1, 2.0, 1.1),
          position: new THREE.Vector3(1.9, 1.0, -3.15)
        },
        {
          extents: new THREE.Vector3(1.0, 2.0, 0.1),
          position: new THREE.Vector3(1.4, 1.0, -2.6)
        },
        {
          extents: new THREE.Vector3(0.1, 2.0, 0.9),
          position: new THREE.Vector3(0.9, 1.0, -2.15)
        },
        {
          extents: new THREE.Vector3(1.6, 2.0, 0.1),
          position: new THREE.Vector3(1.7, 1.0, -1.7)
        },
        {
          extents: new THREE.Vector3(0.1, 2.0, 0.9),
          position: new THREE.Vector3(2.5, 1.0, -1.25)
        },
        {
          extents: new THREE.Vector3(1.7, 2.0, 0.1),
          position: new THREE.Vector3(1.65, 1.0, -0.8)
        },
        {
          extents: new THREE.Vector3(3.5, 0.1, 7.3),
          position: new THREE.Vector3(-0.85, 0.0, 0.05)
        },
        {
          extents: new THREE.Vector3(1.0, 0.1, 1.1),
          position: new THREE.Vector3(1.4, 0.0, -3.15)
        },
        {
          extents: new THREE.Vector3(1.6, 0.1, 0.9),
          position: new THREE.Vector3(1.7, 0.0, -1.25)
        },
        {
          extents: new THREE.Vector3(1.0, 0.3, 0.5),
          position: new THREE.Vector3(-1.1, 0.75, 3.25)
        },
        {
          extents: new THREE.Vector3(0.7, 0.1, 0.5),
          position: new THREE.Vector3(-2.15, 0.5, 2.55)
        },
        {
          extents: new THREE.Vector3(0.1, 0.55, 0.1),
          position: new THREE.Vector3(-1.8, 0.275, 2.3)
        },
        {
          extents: new THREE.Vector3(0.1, 0.4, 0.1),
          position: new THREE.Vector3(-1.8, 0.275, 2.8)
        },
        {
          extents: new THREE.Vector3(0.1, 0.4, 0.1),
          position: new THREE.Vector3(-2.5, 0.275, 2.3)
        },
        {
          extents: new THREE.Vector3(0.1, 0.4, 0.1),
          position: new THREE.Vector3(-2.5, 0.275, 2.8)
        },
        {
          extents: new THREE.Vector3(0.5, 0.1, 1.3),
          position: new THREE.Vector3(-0.95, 0.46, 0.95)
        },
        {
          extents: new THREE.Vector3(0.5, 0.6, 1.9),
          position: new THREE.Vector3(-1.95, 0.3, 1.15)
        },
        {
          extents: new THREE.Vector3(0.3, 0.9, 1.9),
          position: new THREE.Vector3(-2.35, 0.45, 1.15)
        },
        {
          extents: new THREE.Vector3(0.6, 0.1, 0.7),
          position: new THREE.Vector3(-2.1, 0.5, -0.25)
        },
        {
          extents: new THREE.Vector3(1.2, 0.6, 0.6),
          position: new THREE.Vector3(-1.0, 0.3, -0.3)
        },
        {
          extents: new THREE.Vector3(1.2, 0.9, 0.3),
          position: new THREE.Vector3(-1.0, 0.45, -0.75)
        },
        {
          extents: new THREE.Vector3(0.3, 0.8, 0.8),
          position: new THREE.Vector3(0.55, 0.4, 1.0)
        },
        {
          extents: new THREE.Vector3(1.0, 0.8, 0.6),
          position: new THREE.Vector3(-1.5, 0.4, -2.1)
        },
        {
          extents: new THREE.Vector3(0.4, 0.9, 0.4),
          position: new THREE.Vector3(0.6, 0.45, -2.1)
        },
        {
          extents: new THREE.Vector3(0.4, 0.6, 0.2),
          position: new THREE.Vector3(-0.4, 0.3, -3.5)
        }
];
var roomB = [
    {
        extents: new THREE.Vector3(7.3, 2.0, 0.1),
        position: new THREE.Vector3(0.15, 1.0, -3.9)
    },
    {
        extents: new THREE.Vector3(7.3, 2.0, 0.1),
        position: new THREE.Vector3(0.15, 1.0, 3.9)
    },
    {
        extents: new THREE.Vector3(0.1, 2.0, 7.8),
        position: new THREE.Vector3(-3.5, 1.0, 0.0)
    },
    {
        extents: new THREE.Vector3(0.1, 2.0, 7.8),
        position: new THREE.Vector3(3.8, 1.0, 0.0)
    },
    {
        extents: new THREE.Vector3(7.3, 0.1, 7.8),
        position: new THREE.Vector3(0.15, 0.0, 0.0)
    },
    {
        extents: new THREE.Vector3(1.1, 0.1, 2.8),
        position: new THREE.Vector3(0.35, 0.7, -0.4)
    },
    {
        extents: new THREE.Vector3(0.4, 0.8, 0.9),
        position: new THREE.Vector3(0.6, 0.4, 1.55)
    },
    {
        extents: new THREE.Vector3(0.4, 1.8, 0.9),
        position: new THREE.Vector3(0.2, 0.9, 1.65)
    },
    {
        extents: new THREE.Vector3(0.5, 0.5, 1.3),
        position: new THREE.Vector3(-0.75, 0.25, 0.85)
    },
    {
        extents: new THREE.Vector3(0.5, 0.7, 0.2),
        position: new THREE.Vector3(-0.75, 0.35, 0.1)
    },
    {
        extents: new THREE.Vector3(0.5, 0.7, 0.2),
        position: new THREE.Vector3(-0.75, 0.35, 1.6)
    },
    {
        extents: new THREE.Vector3(0.4, 0.7, 1.7),
        position: new THREE.Vector3(-0.3, 0.35, 0.85)
    },
    {
        extents: new THREE.Vector3(0.1, 0.5, 0.5),
        position: new THREE.Vector3(0.1, 0.95, 0.05)
    },
    {
        extents: new THREE.Vector3(0.4, 0.6, 0.6),
        position: new THREE.Vector3(0.1, 1.0, 0.7)
    },
    {
        extents: new THREE.Vector3(0.4, 1.8, 0.6),
        position: new THREE.Vector3(0.35, 0.9, 2.7)
    },
    {
        extents: new THREE.Vector3(1.5, 0.1, 0.9),
        position: new THREE.Vector3(1.35, 0.75, 3.15)
    },
    {
        extents: new THREE.Vector3(7.3, 0.9, 0.3),
        position: new THREE.Vector3(0.15, 0.45, 3.75)
    },
    {
        extents: new THREE.Vector3(1.3, 0.5, 0.1),
        position: new THREE.Vector3(1.35, 1.05, 3.25)
    },
    {
        extents: new THREE.Vector3(0.1, 1.7, 0.1),
        position: new THREE.Vector3(3.0, 0.85, 3.6)
    },
    {
        extents: new THREE.Vector3(2.2, 0.9, 0.2),
        position: new THREE.Vector3(-1.4, 0.45, 3.5)
    },
    {
        extents: new THREE.Vector3(2.2, 0.5, 0.7),
        position: new THREE.Vector3(-1.4, 0.25, 3.05)
    },
    {
        extents: new THREE.Vector3(2.2, 0.5, 0.7),
        position: new THREE.Vector3(-1.4, 0.25, 3.05)
    },
    {
        extents: new THREE.Vector3(0.5, 1.7, 0.9),
        position: new THREE.Vector3(-3.25, 0.85, 3.45)
    },
    {
        extents: new THREE.Vector3(0.2, 0.1, 0.6),
        position: new THREE.Vector3(-2.8, 0.6, 2.65)
    },
    {
        extents: new THREE.Vector3(0.3, 0.1, 0.6),
        position: new THREE.Vector3(-2.8, 0.6, 2.65)
    },
    {
        extents: new THREE.Vector3(0.4, 0.5, 0.6),
        position: new THREE.Vector3(-3.2, 0.25, 2.7)
    },
    {
        extents: new THREE.Vector3(0.3, 1.4, 0.7),
        position: new THREE.Vector3(-3.25, 0.7, 1.85)
    },
    {
        extents: new THREE.Vector3(0.5, 0.6, 0.6),
        position: new THREE.Vector3(-3.15, 0.3, 0.8)
    },
    {
        extents: new THREE.Vector3(0.6, 0.1, 3.0),
        position: new THREE.Vector3(-3.1, 0.75, -1.1)
    },
    {
        extents: new THREE.Vector3(0.8, 0.1, 5.3),
        position: new THREE.Vector3(3.40, 0.95, -0.25)
    },
    {
        extents: new THREE.Vector3(0.8, 1.0, 0.7),
        position: new THREE.Vector3(3.40, 0.5, -1.35)
    },
    {
        extents: new THREE.Vector3(0.8, 1.0, 0.6),
        position: new THREE.Vector3(3.40, 0.5, 0.2)
    },
    {
        extents: new THREE.Vector3(0.4, 0.1, 1.5),
        position: new THREE.Vector3(3.6, 1.5, -2.15)
    },
    {
        extents: new THREE.Vector3(0.4, 0.1, 1.8),
        position: new THREE.Vector3(3.6, 1.5, 1.4)
    },
    {
        extents: new THREE.Vector3(0.4, 1.8, 0.4),
        position: new THREE.Vector3(3.6, 0.9, 0.1)
    },
    {
        extents: new THREE.Vector3(0.4, 0.2, 5.3),
        position: new THREE.Vector3(3.6, 1.1, -0.25)
    },
    {
        extents: new THREE.Vector3(0.4, 0.2, 0.1),
        position: new THREE.Vector3(0.2, 0.5, -2.15)
    },
    {
        extents: new THREE.Vector3(0.4, 0.1, 0.3),
        position: new THREE.Vector3(0.2, 0.35, -1.95)
    },
    {
        extents: new THREE.Vector3(0.1, 0.4, 0.4),
        position: new THREE.Vector3(-0.35, 0.7, -0.8)
    },
    {
        extents: new THREE.Vector3(0.1, 0.4, 0.4),
        position: new THREE.Vector3(-0.35, 0.7, -0.8)
    },
    {
        extents: new THREE.Vector3(0.1, 0.3, 0.3),
        position: new THREE.Vector3(0.95, 0.65, -0.95)
    },
    {
        extents: new THREE.Vector3(0.1, 0.4, 0.3),
        position: new THREE.Vector3(0.95, 0.6, 0.25)
    },
    {
        extents: new THREE.Vector3(0.1, 0.3, 0.4),
        position: new THREE.Vector3(2.85, 0.85, -2.2)
    },
    {
        extents: new THREE.Vector3(0.1, 0.3, 0.3),
        position: new THREE.Vector3(2.75, 0.85, -0.65)
    },
    {
        extents: new THREE.Vector3(0.4, 1.1, 0.3),
        position: new THREE.Vector3(2.8, 0.55, 1.25)
    },
    {
        extents: new THREE.Vector3(0.8, 0.9, 0.5),
        position: new THREE.Vector3(3.4, 0.45, 2.65)
    },
    {
        extents: new THREE.Vector3(0.1, 0.4, 0.4),
        position: new THREE.Vector3(-2.65, 0.6, -2.0)
    },
    {
        extents: new THREE.Vector3(0.1, 0.4, 0.3),
        position: new THREE.Vector3(-2.45, 0.7, -0.45)
    },


];

export { roomA as RoomAColliders, roomB as RoomBColliders };