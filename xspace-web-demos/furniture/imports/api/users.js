import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Users = new Mongo.Collection('users');

if (Meteor.isServer) {
    Meteor.startup(() => {
        Users.remove({});
    });

    Meteor.publish("users", function roomPublication() {
        return Users.find({});
    }); 

    Meteor.methods({
        "users.insert": function (clientId, worldId, position=[0 ,0, 0], rotation=[0, 0, 0, 0]) {
            let objKey = Users.insert({
                clientId: clientId, 
                worldId: worldId,
                position: position,
                rotation: rotation,
                color: '#'+Math.floor(Math.random()*16777215).toString(16)
            });
            return objKey;
        },
        "users.rotate": function (_id, newQuaternion) {
            Users.update(_id, {
                $set: { rotation: newQuaternion }
            });
        },
        "users.move": function (_id, newPosition) {
            Users.update(_id, {
                $set: { position: newPosition }
            });
        },
        'users.reset': function() {
            Users.remove({});
          },
    });
}