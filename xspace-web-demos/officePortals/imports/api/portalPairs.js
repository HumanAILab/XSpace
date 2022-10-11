import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const PortalPairs = new Mongo.Collection('portalPairs');

if (Meteor.isServer) {
    Meteor.startup(() => {
        PortalPairs.remove({});
    });

    Meteor.publish("portalPairs", function portalPairPublication() {
        return PortalPairs.find({});
    }); 

    Meteor.methods({
        "portalPairs.addPair": function (aPosition, aRotation, aScale, bPosition, bRotation, bScale) {
            PortalPairs.insert({
                aPosition: aPosition,
                aRotation: aRotation,
                aScale: aScale,
                bPosition: bPosition,
                bRotation: bRotation,
                bScale: bScale
            })
        },
        /*
        "portalPairs.updateA": function (_id, newPosition, newRotation, newScale) {
            PortalPairs.update(_id, {
                $set: {
                    aPosition: newPosition,
                    aRotation: newRotation,
                    aScale: newScale
                }
            })
        },
        "portalPairs.updateB": function (_id, newPosition, newRotation, newScale) {
            PortalPairs.update(_id, {
                $set: {
                    bPosition: newPosition,
                    bRotation: newRotation,
                    bScale: newScale
                }
            })
        },
        "portalPairs.updateAScale": function (_id, newScale) {
            PortalPairs.update(_id, {
                $set: {
                    aScale: newScale
                }
            })
        },
        "portalPairs.updateBScale": function (_id, newScale) {
            PortalPairs.update(_id, {
                $set: {
                    bScale: newScale
                }
            })
        },
        */
        "portalPairs.reset": function () {
            PortalPairs.remove({});
        }
    })
}