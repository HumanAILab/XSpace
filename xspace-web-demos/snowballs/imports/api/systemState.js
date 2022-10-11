import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const SystemState = new Mongo.Collection('systemState');

if (Meteor.isServer) {

    Meteor.startup(() => {
        console.log("startup");
        SystemState.remove({});
        SystemState.insert({ // Init with default values
            created: new Date(),
            Ascanning: false,
            Adone: false,
            AheadKey: "", // ID of user who claimed scan
            Bscanning: false,
            Bdone: true, // Player B will join from web client
            BheadKey: ""
        });
    });

    Meteor.publish('systemState', function systemStatePublication() {
        return SystemState.find({});
    });

    Meteor.methods({

        // init system state
        // if we are in user study mode, we want to skip the scanning step
        'systemState.init': function(studyMode=false) {
            console.log("Initializing system state");
            SystemState.insert({
                created: new Date(),
                Ascanning: false,
                AheadKey: "",
                Adone: studyMode,
                Bscanning: false,
                Bdone: studyMode,
                BheadKey: ""
            });
        },
    
        'systemState.update': function(room, scanningStatus, doneStatus, headKey) {
            let state = SystemState.findOne({});
            if (!state) {
              console.warn("can not find system state to update");
            }
            console.log(state);
            if (room == "A") {
                SystemState.update(state._id, {$set: {
                    Ascanning: scanningStatus,
                    Adone: doneStatus,
                    AheadKey: headKey
                }});
            }
            else if (room == "B") {
                SystemState.update(state._id, {$set: {
                    Bscanning: scanningStatus,
                    Bdone: doneStatus,
                    BheadKey: headKey
                }});
            }
            
          },
    
        'systemState.deleteAll': function() {
            SystemState.remove({});
        },
    
        'systemState.reset': function(studyMode=false) {
            let state = SystemState.findOne({_id: _id});
            if (!state) {
              console.warn("can not find system state for id: " + _id + "to update");
            }
            SystemState.update(_id, {$set: {
                Ascanning: false,
                Adone: studyMode,
                Bscanning: false,
                Bdone: studyMode
            }})
        }
        
    });
};