using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Moulin.DDP;
using System;
using HoloToolkit.Unity.InputModule;

public class RoomHandler : MonoBehaviour
{

    public Communication com;
    public Vector3 RoomAPos;
    public Vector3 RoomBPos;

    public string RoomAKey;
    public string RoomBKey;

    private JsonObjectCollection roomCollection;

    // note that GameObject creation and manipulation needs to be called from the main thread, so we
    // fill lists and do the heavy-lifting in the update function
    private Queue<KeyValuePair<string, JSONObject>> addPos = new Queue<KeyValuePair<string, JSONObject>>();
    private Queue<KeyValuePair<string, JSONObject>> updatePos = new Queue<KeyValuePair<string, JSONObject>>();

    // Use this for initialization
    void Start()
    {
        roomCollection = com.GetCollection("rooms");
        if (roomCollection == null)
        {
            com.OnDBStart.AddListener(() => {
                roomCollection = com.GetCollection("rooms");
                SetupAvatarCollection();
            });
        }
        else
        {
            SetupAvatarCollection();
        }
    }

    private void SetupAvatarCollection()
    {
        lock (addPos)
        {
            roomCollection.OnAdded += (id, fields) =>
            {
                addPos.Enqueue(new KeyValuePair<string, JSONObject>(id, fields));
            };
        }
        lock (updatePos)
        {
            roomCollection.OnChanged += (id, fields, cleared) =>
            {
                // Debug.Log("Change " + id + " - " + fields);
                updatePos.Enqueue(new KeyValuePair<string, JSONObject>(id, fields));
            };
        }
    }

    // Update is called once per frame
    void Update()
    {
        KeyValuePair<string, JSONObject> data;
        string roomID;

        lock (addPos)
        {
            while (addPos.Count > 0)
            {
                data = addPos.Dequeue();
                roomID = data.Value.GetField("id").str;

                if (roomID == "A")
                {
                    RoomAKey = data.Key;
                }
                else if (roomID == "B")
                {
                    RoomBKey = data.Key;
                }
                
           
                UpdateRoomPosition(roomID, data.Value.GetField("position"));
            }
        }
        lock (updatePos)
        {
            while (updatePos.Count > 0)
            {
                data = updatePos.Dequeue();

                if (data.Key == RoomAKey)
                {
                    roomID = "A";
                    UpdateRoomPosition(roomID, data.Value.GetField("position"));
                }
                else if (data.Key == RoomBKey)
                {
                    roomID = "B";
                    UpdateRoomPosition(roomID, data.Value.GetField("position"));
                }

                
            }
        }
    }

    public void UpdateRoomPosition(string roomID, JSONObject position)
    {
        if (position == null) return;

        if (roomID == "A")
        {
            RoomAPos = new Vector3(
                -position[0].f,
                position[1].f,
                position[2].f);
        }
        else if (roomID == "B")
        {
            RoomBPos = new Vector3(
                -position[0].f,
                position[1].f,
                position[2].f);
        }
    }
}
