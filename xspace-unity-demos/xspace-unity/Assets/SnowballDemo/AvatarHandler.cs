using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Moulin.DDP;

using System;
using HoloToolkit.Unity.InputModule;

public class AvatarHandler : MonoBehaviour {

    public Communication com;
    public GameObject avatarPrefab;

    private JsonObjectCollection avatarCollection;

    // all known geometry
    Dictionary<string, GameObject> avatars = new Dictionary<string, GameObject>();

    // note that GameObject creation and manipulation needs to be called from the main thread, so we
    // fill lists and do the heavy-lifting in the update function
    private Queue<KeyValuePair<string, JSONObject>> createAvatar = new Queue<KeyValuePair<string, JSONObject>>();
    private Queue<KeyValuePair<string, JSONObject>> updateAvatar = new Queue<KeyValuePair<string, JSONObject>>();

    // Use this for initialization
    void Start ()
    {
        avatarCollection = com.GetCollection("players");
        if (avatarCollection == null)
        {
            com.OnDBStart.AddListener(() => {
                avatarCollection = com.GetCollection("players");
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
        lock (createAvatar)
        {
            avatarCollection.OnAdded += (id, fields) =>
            {
                createAvatar.Enqueue(new KeyValuePair<string, JSONObject>(id, fields));
            };
        }
        lock (updateAvatar)
        {
            avatarCollection.OnChanged += (id, fields, cleared) =>
            {
                // Debug.Log("Change " + id + " - " + fields);
                updateAvatar.Enqueue(new KeyValuePair<string, JSONObject>(id, fields));
            };
        }
    }

    // Update is called once per frame
    void Update ()
    {
        KeyValuePair<string, JSONObject> data;
        string idData;
        GameObject obj;

        lock (createAvatar)
        {
            while (createAvatar.Count > 0)
            {
                data = createAvatar.Dequeue();

                // Check if this is our own avatar:
                // TODO: Fix so we can have another person in space A?
                if (data.Value.GetField("worldId").str == "A") return;

                obj = Instantiate(avatarPrefab, new Vector3(0, 0, 0), Quaternion.identity);

                // data.Key is the DB _id of the object
                avatars.Add(data.Key, obj); // Save reference to GO in disctionary

                UpdateAvatarPosition(data.Value.GetField("position"), avatars[data.Key]);
                UpdateAvatarRotation(data.Value.GetField("rotation"), avatars[data.Key]);

                SetAvatarColor(data.Value.GetField("color").str, avatars[data.Key]);
                SetAvatarName(data.Value.GetField("name"), avatars[data.Key]);
            }
        }
        lock (updateAvatar)
        {
            while (updateAvatar.Count > 0)
            {
                data = updateAvatar.Dequeue();
                if (!avatars.ContainsKey(data.Key)) return;

                UpdateAvatarPosition(data.Value.GetField("position"), avatars[data.Key]);
                UpdateAvatarRotation(data.Value.GetField("rotation"), avatars[data.Key]);
                SetAvatarName(data.Value.GetField("name"), avatars[data.Key]);
            }
        }
    }

    public void SetAvatarColor(string hex, GameObject obj)
    {
        Color newColor;

        if (ColorUtility.TryParseHtmlString(hex, out newColor))
        {
            //Get the Renderer component from the new cube
            var headRenderer = obj.transform.GetChild(0).gameObject.GetComponent<Renderer>();
            var bodyRenderer = obj.transform.GetChild(1).gameObject.GetComponent<Renderer>();

            //Call SetColor using the shader property name "_Color" and setting the color to red
            headRenderer.material.SetColor("_Color", newColor);
            bodyRenderer.material.SetColor("_Color", newColor);
        }

    }

    public void SetAvatarName(JSONObject name, GameObject obj)
    {
        if (name == null) return;

        String nameStr = name.str;
        obj.GetComponentInChildren<TextMesh>().text = nameStr;

    }

    public void UpdateAvatarPosition(JSONObject position, GameObject obj)
    {
        if (position == null) return;
        Vector3 originalPos = new Vector3(
            -position[0].f,
            position[1].f,
            position[2].f); // Can add an offset after this line if needed

        obj.transform.position = originalPos + (this.gameObject.GetComponent<RoomHandler>().RoomBPos - this.gameObject.GetComponent<RoomHandler>().RoomAPos);
    }

    public void UpdateAvatarRotation(JSONObject rotation, GameObject obj)
    {
        if (rotation == null) return;

        GameObject child = obj.transform.GetChild(0).gameObject;

        if (rotation[3] == null)
        {
            child.transform.rotation = Quaternion.Euler(
            rotation[0].f * Mathf.Rad2Deg,
            -rotation[1].f * Mathf.Rad2Deg,
            -rotation[2].f * Mathf.Rad2Deg);
        }
        else
        {
            Quaternion quat = new Quaternion(
            rotation[0].f * Mathf.Rad2Deg,
            rotation[1].f * Mathf.Rad2Deg,
            rotation[2].f * Mathf.Rad2Deg,
            rotation[3].f * Mathf.Rad2Deg);

            Vector3 angles = quat.eulerAngles;

            child.transform.rotation = Quaternion.Euler(
            angles[0],
            -angles[1],
            -angles[2]);

        }
        
    }
}
