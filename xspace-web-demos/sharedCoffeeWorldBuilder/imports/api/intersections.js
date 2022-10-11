import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Intersections = new Mongo.Collection('intersections');

if (Meteor.isServer) {
    Meteor.startup(() => {
        Intersections.remove({});
        Intersections.insert({
            defined: false, 
            shared: false, 
            start: [0.0, 0.0, 0.0],
            end: [0.0, 0.0, 0.0]
        });
    });

    Meteor.publish("intersections", function intersectionsPublication() {
        return Intersections.find({});
    }); 

    Meteor.methods({
        "intersections.set": function (start, end) {
            let _id = Intersections.findOne({})._id;
            Intersections.update(_id, {
                $set: {
                    defined: true,
                    shared: false,
                    start: start,
                    end: end
                }
            });
        },
        "intersections.clear": function () {
            let _id = Intersections.findOne({})._id;
            Intersections.update(_id, {
                $set: {
                    defined: false,
                    shared: false,
                    start: [0.0, 0.0, 0.0],
                    end: [0.0, 0.0, 0.0]
                }
            });
        },
        "intersections.share": function () {
            let _id = Intersections.findOne({})._id;
            Intersections.update(_id, {
                $set: {
                    shared: true
                }
            });
        },
        "intersections.clearShare": function () {
            let _id = Intersections.findOne({})._id;
            Intersections.update(_id, {
                $set: {
                    shared: false
                }
            });
        }
    });
}