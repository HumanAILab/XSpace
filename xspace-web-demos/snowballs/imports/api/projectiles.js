import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Projectiles = new Mongo.Collection('projectiles');

if (Meteor.isServer) {
    Meteor.startup(() => {
        Projectiles.remove({});
    });

    Meteor.publish("projectiles", function roomPublication() {
        return Projectiles.find({});
    });

    Meteor.methods({
        "projectiles.deleteAll": function() {
            Projectiles.remove({});
        },

        "projectiles.insert": function (worldId, position, direction) {
            Projectiles.insert({
                world: worldId, 
                position: position, 
                direction: direction
            });
        }
    });
}