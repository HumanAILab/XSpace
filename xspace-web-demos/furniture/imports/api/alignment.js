import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Alignment = new Mongo.Collection('alignment');

// Currently hard-coding room A as the dollhouse (TODO)
if (Meteor.isServer) {
    Meteor.startup(() => {
        Alignment.remove({});
        Alignment.insert({
            id: "A",
            position: [0.0, 0.0, 0.0],
            rotation: [0.0, 0.0, 0.0, 0.0],
            scale: [0.125, 0.125, 0.125]
        });
    });

    Meteor.publish("alignment", function alignmentPublication() {
        return Alignment.find({});
    });
    
    Meteor.methods({
        "alignment.reset": function (id) {
            Alignment.remove({});
            Alignment.insert({
                id: "A",
                position: [0.0, 0.0, 0.0],
                rotation: [0.0, 0.0, 0.0, 0.0],
                scale: [0.125, 0.125, 0.125]
            });
        },
        "alignment.move": function (newPos) {
            let _id = Alignment.findOne({})._id;
            Alignment.update(_id, {
                $set: { position: newPos }
            });
        },
        "alignment.rotate": function (newRot) {
            let _id = Alignment.findOne({})._id;
            Alignment.update(_id, {
                $set: { rotation: newRot }
            });
        },
        "alignment.scale": function (newScale) {
            let _id = Alignment.findOne({})._id;
            Alignment.update(_id, {
                $set: { scale: newScale }
            });
        }
    });
}