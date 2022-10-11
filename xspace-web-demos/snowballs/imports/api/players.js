import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Players = new Mongo.Collection('players');

if (Meteor.isServer) {
    Meteor.startup(() => {
        Players.remove({});
    });

    Meteor.publish("players", function roomPublication() {
        return Players.find({});
    }); 

    Meteor.methods({
        "players.insert": function (clientId, worldId, isHL=false, position=[0 ,0, 0], rotation=[0, 0, 0]) {
            let objKey = Players.insert({
                clientId: clientId, 
                worldId: worldId, 
                isHL: isHL, // true if the user joining is a HL user
                position: position,
                rotation: rotation,
                color: '#'+Math.floor(Math.random()*16777215).toString(16),
                name: null
            });
            return objKey;
        },
        "players.rotate": function (_id, newQuaternion) {
            Players.update(_id, {
                $set: { rotation: newQuaternion }
            });
        },
        "players.move": function (_id, newPosition) {
            Players.update(_id, {
                $set: { position: newPosition }
            });
        },
        'players.deleteAll': function() {
            Players.remove({});
          },
        'players.name': function(_id, newName) {
            Players.update(_id, {
                $set: { name: newName }
            });
        }
    });
}