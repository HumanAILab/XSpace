import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const ObjectPairs = new Mongo.Collection('objectPairs');

if (Meteor.isServer) {
    Meteor.startup(() => {
        ObjectPairs.remove({});
    });

    Meteor.publish("objectPairs", function objectPairsPublication() {
        return ObjectPairs.find({});
    });
    
    Meteor.methods({
        "objectPairs.reset": function () {
            ObjectPairs.remove({});
        },
        "objectPairs.shareA": function (shareStart, shareEnd, shareOrientation, position, rotation) {
            ObjectPairs.insert({
                type: "shareA",
                aStart: shareStart,
                aEnd: shareEnd,
                aYOrientation: shareOrientation,
                aPosition: null,
                aRotation: null, 
                bStart: null,
                bEnd: null,
                bYOrientation: null, 
                bPosition: position,
                bRotation: rotation
            });
        },
        "objectPairs.shareB": function (shareStart, shareEnd, shareOrientation, position, rotation) {
            ObjectPairs.insert({
                type: "shareB",
                aStart: null,
                aEnd: null,
                aYOrientation: null,
                aPosition: position,
                aRotation: rotation,
                bStart: shareStart,
                bEnd: shareEnd,
                bYOrientation: shareOrientation,
                bPosition: null,
                bRotation: null,
            });
        },
        "objectPairs.align": function (aStart, aEnd, aOrientation, bStart, bEnd, bOrientation) {
            ObjectPairs.insert({
                type: "align",
                aStart: aStart,
                aEnd: aEnd,
                aYOrientation: aOrientation,
                aPosition: null,
                aRotation: null,
                bStart: bStart,
                bEnd: bEnd,
                bYOrientation: bOrientation,
                bPosition: null,
                bRotation: null,
            });
        },
    });
}