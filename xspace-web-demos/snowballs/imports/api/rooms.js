import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Rooms = new Mongo.Collection('rooms');

if (Meteor.isServer) {
    Meteor.startup(() => {
        Rooms.remove({});
        Rooms.insert({
            id: "A",
            position: [-5.0, 0.0, 0.0],
            rotation: [0.0, 0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
            parts: [],
            done: false
        });
        Rooms.insert({
            id: "B",
            position: [5.0, 0.0, 0.0],
            rotation: [0.0, 0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
            parts: [],
            done: false
        });
    });

    Meteor.publish("rooms", function roomPublication() {
        return Rooms.find({});
    }); 

    Meteor.publish("roomA", function roomPublication() {
        return Rooms.find({ id: "A" });
    }); 

    Meteor.publish("roomB", function roomPublication() {
        return Rooms.find({ id: "B" });
    }); 

    Meteor.methods({
        "rooms.reset": function() {
            Rooms.remove({});
            Rooms.insert({
                id: "A",
                position: [-5.0, 0.0, 0.0],
                rotation: [0.0, 0.0, 0.0, 0.0],
                scale: [1.0, 1.0, 1.0],
                parts: [],
                done: false
            });
            Rooms.insert({
                id: "B",
                position: [5.0, 0.0, 0.0],
                rotation: [0.0, 0.0, 0.0, 0.0],
                scale: [1.0, 1.0, 1.0],
                parts: [],
                done: false
            });
        },

        "room.move": function(_id, newPos) {
            Rooms.update(_id, {
                $set: { position: newPos }
            });
        },
        "room.rotate": function(_id, newRot) {
            Rooms.update(_id, {
                $set: { rotation: newRot }
            });
        },
        "room.scale": function(_id, newScale) {
            Rooms.update(_id, {
                $set: { scale: newScale }
            });
        },

        "room.updateDone": function(id, done=true) {
            console.log("updating room in db");
            let _id = Rooms.findOne({ id: id })._id;
            Rooms.update(_id, {
                $set: { done: done }
            });
        }
    });
}