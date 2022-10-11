# Snowballs

## How to Use

In the scene containing both worlds (let us call this the <em>composition scene</em> going forward, http://localhost:3000/config), double click on a mesh to attach a Transform Controller. Use the Transform Controller to compose the space accordingly. 

To draw an intersection, click the <em>Define Intersection</em> button. Click on a space in the <em>composition scene</em> to start drawing the intersection. The intersection space will be bounded with a semi-transparent boundary. Click again to set the end of the boundry.

Click the <em>Share Intersection</em> button to confirm the intersection. A preview of the intersection space will then be displayed in the single room scenes.

In a different browser tab, navigate to either http://localhost:3000/player/A or http://localhost:3000/player/B to view the experience from a first person perspective. You can launch the application using multiple browsers to simulate multiple players. WASD to move. Click to fire a snowball. 

## Database Structure

```
'players': Collection for storing HoloLens or Web player data
  _id: DB Unique ID of player. Replaces 'headKey' from SystemState Collection.
  roomID: Unique identifier of room. In web version, this determines which scan will be loaded.
  isHL: Is the player joining from HoloLens. To determine if we will load a file or wait for a scan.
  isScanning: bool, is the device currently scanning. Replaces SystemState Collection.
  isDone: bool, is the device done scanning.
  position: In local room coordinates.
  rotation: In local room coordinates.
  
'rooms': Collection of rooms
  roomID: ID of room. Either set to string by web client or generated to be unique for scan.
  isDone: bool, is scan done/ is file loaded
  offset: Vector, difference between original orgin and merged origin for scans.
  postition: In composition space.
  rotation: In composition space.
  scale: In composition space.
  
'roomScans': Scanned parts of a mesh
  roomID: Maps to 'rooms' collection, which room is this scan a part of.
  position: Relative to local room origin.
  roation: Relative to local room origin.
  scale: Relative to local room origin.
  objString: string of OBJ format to describe mesh
  
'alignment':
  intersection: bool, is there an intersection area marked 
  intersectionStart: [0.0, 0.0, 0.0],
  intersectionEnd: [0.0, 0.0, 0.0],
  shared: bool, has the user shared the intersection
  sharedStart: [0.0, 0.0, 0.0],
  sharedEnd: [0.0, 0.0, 0.0]
  
'projectiles':
  roomID: which room the projectile originates in 
  position: position, 
  direction: direction
```

## File Structure
Following Meteor's suggested directory layout:

```
imports/
  startup/
    client/
      index.js                 # import client startup through a single index entry point
      routes.js                # set up all routes in the app
    server/
      index.js                 # import server startup through a single index entry point

  api/                         # one file for each collection

  ui/                          # one folder for each page

client/
  main.js                      # client entry point, imports all client code

server/
  main.js                      # server entry point, imports all server code
```
