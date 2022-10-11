import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Rooms = new Mongo.Collection('rooms');

if (Meteor.isServer) {
    Meteor.startup(() => {
        Rooms.remove({});
        Rooms.insert({ id: "A" });
        Rooms.insert({ id: "B" });
    });

    Meteor.publish("rooms", function roomPublication() {
        return Rooms.find({});
    });

    Meteor.methods({
        "rooms.reset": function () {
            Rooms.remove({});
            Rooms.insert({ id: "A" });
            Rooms.insert({ id: "B" });
        },
    });
}