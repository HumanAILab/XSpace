import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Furniture = new Mongo.Collection("furniture");

if (Meteor.isServer) {
    Meteor.startup(() => {
        Furniture.remove({});
    });

    Meteor.publish("furniture", function dollhouseAPublication() {
        return Furniture.find({});
    });

    Meteor.methods({
        "furniture.add": function (source, position, rotation, scale) {
            Furniture.insert({
                source: source, 
                position: position,
                rotation: rotation, 
                scale: scale
            });
        },
        "furniture.reset": function () {
            Furniture.remove({});
        },
        "furniture.move": function (_id, position) {
            Furniture.update(_id, {
                $set: {
                    position: position
                }
            });
        },
        "furniture.rotate": function (_id, rotation) {
            Furniture.update(_id, {
                $set: {
                    rotation: rotation
                }
            });
        },
        "furniture.scale": function (_id, scale) {
            Furniture.update(_id, {
                $set: {
                    scale: scale
                }
            });
        }   
    });
}