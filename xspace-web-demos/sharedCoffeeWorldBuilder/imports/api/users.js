import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Users = new Mongo.Collection("users");

if (Meteor.isServer) {
    Meteor.startup(() => {
        Users.remove({});
    });

    Meteor.publish("users", function userPublication() {
        return Users.find({});
    });

    Meteor.methods({
        "users.insert": function (clientId, worldId) {
            Users.insert({
                clientId: clientId,
                worldId: worldId,
                position: [0.0, 0.0, 0.0],
                headRotation: [0.0, 0.0, 0.0]
            });
        },
        "users.update": function (clientId, newPosition, newHeadRotation) {
            let _id = Users.findOne({ clientId: clientId })._id;
            Users.update(_id, {
                $set: {
                    position: newPosition,
                    headRotation: newHeadRotation
                }
            });
        },
        "users.remove": function (clientId) {
            let _id = Users.findOne({ clientId: clientId })._id;
            Users.remove(_id);
        }
    })
}