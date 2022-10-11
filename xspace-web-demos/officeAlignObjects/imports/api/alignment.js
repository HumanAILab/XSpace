import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Alignment = new Mongo.Collection('alignment');

if (Meteor.isServer) {
    Meteor.startup(() => {
        Alignment.remove({});
    });

    Meteor.publish("alignment", function alignmentPublication() {
        return Alignment.find({});
    });
    
    Meteor.methods({
        "alignment.reset": function () {
            Alignment.remove({});
        },
        "alignment.set": function (numPairs) {
            Alignment.insert({
                numPairs: numPairs
            });
        }
    });
}