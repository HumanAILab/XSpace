import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Alignment = new Mongo.Collection('alignment');

if (Meteor.isServer) {
    Meteor.startup(() => {
        Alignment.remove({});
        Alignment.insert({
            intersection: false, 
            intersectionStart: [0.0, 0.0, 0.0],
            intersectionEnd: [0.0, 0.0, 0.0],
            shared: false,
            sharedStart: [0.0, 0.0, 0.0],
            sharedEnd: [0.0, 0.0, 0.0]
        });
    });

    Meteor.publish("alignment", function alignmentPublication() {
        return Alignment.find({});
    }); 

    Meteor.methods({
        "alignment.reset": function() {
            Alignment.remove({});
            Alignment.insert({
                intersection: false, 
                intersectionStart: [0.0, 0.0, 0.0],
                intersectionEnd: [0.0, 0.0, 0.0],
                shared: false,
                sharedStart: [0.0, 0.0, 0.0],
                sharedEnd: [0.0, 0.0, 0.0]
            });
        },

        "alignment.setIntersection": function (start, end) {
            let _id = Alignment.findOne({})._id;
            Alignment.update(_id, {
                $set: {
                    intersection: true,
                    intersectionStart: start,
                    intersectionEnd: end
                }
            });
        },
        "alignment.clearIntersection": function () {
            let _id = Alignment.findOne({})._id;
            Alignment.update(_id, {
                $set: {
                    intersection: false
                }
            });
        },
        "alignment.updateShared": function (start, end) {
            let _id = Alignment.findOne({})._id;
            Alignment.update(_id, {
                $set: {
                    shared: true,
                    sharedStart: start,
                    sharedEnd: end
                }
            });
        },
        "alignment.clearShared": function () {
            let _id = Alignment.findOne({})._id;
            Alignment.update(_id, {
                $set: {
                    shared: false
                }
            });
        }
    })
  }