import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const RoomScans = new Mongo.Collection('roomScans');

if (Meteor.isServer) {
    Meteor.publish('roomScans', function roomScansPublication() {
        return RoomScans.find({});
    });

    Meteor.methods({

        // add mesh to database
        // convert to json and render is in Visualization funtion addSpatialGeometry
        'roomScans.add': function(roomID, objString="", position=[0 ,0, 0], rotation=[0, 0, 0], scale=[1, 1, 1]) {
            console.log("inserting custom mesh!");
            RoomScans.insert({
              objString: objString,
              position: position,
              rotation: rotation,
              scale: scale,
              id: roomID // should be "A" or "B"
            });
        },
    
        'roomScans.deleteAll': function() {
            RoomScans.remove({});
        },
        
    });
}