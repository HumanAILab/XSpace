using Moulin.DDP;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// Class for handling incoming data from the server:
// - Whenever the opponent throws a snowball
// - When the oponent avatar joins/ moves
// - Remote Avatar's space added

public class SnowballHandler : MonoBehaviour {

    public Communication com;
    public GameObject snowballPrefab;

    private JsonObjectCollection geometryCollection;

    // all known geometry/ shared objects
    Dictionary<string, GameObject> geometries = new Dictionary<string, GameObject>();

    // note that GameObject creation and manipulation needs to be called from the main thread, so we
    // fill lists and do the heavy-lifting in the update function
    private Queue<KeyValuePair<string, JSONObject>> createGeom = new Queue<KeyValuePair<string, JSONObject>>();

    // Use this for initialization
    void Start ()
    {

        geometryCollection = com.GetCollection("projectiles");
        if (geometryCollection == null)
        {
            com.OnDBStart.AddListener(() => {
                geometryCollection = com.GetCollection("projectiles");
                SetupGeometryCollection();
            });
        }
        else
        {
            SetupGeometryCollection();
        }

    }

    void SetupGeometryCollection()
    {

        lock (createGeom)
        {
            geometryCollection.OnAdded += (id, fields) =>
            {
                createGeom.Enqueue(new KeyValuePair<string, JSONObject>(id, fields));
            };
        }
        return;
    }

    // Update is called once per frame
    void Update () {
        KeyValuePair<string, JSONObject> data;

        lock (createGeom)
        {
            while (createGeom.Count > 0)
            {
                data = createGeom.Dequeue();
                ThrowSnowball(data.Value.GetField("position"), data.Value.GetField("direction"));
            }
        }
    }

    public void ThrowSnowball (JSONObject position, JSONObject direction)
    {
        if (position == null) return;
        Vector3 originalPos = new Vector3(
            -position[0].f,
            position[1].f,
            position[2].f); // Can add an offset after this line if needed

        if (direction == null) return;
        Vector3 originalDir = new Vector3(
            -direction[0].f,
            direction[1].f,
            direction[2].f); // Can add an offset after this line if needed

        Vector3 newPos = originalPos + (this.gameObject.GetComponent<RoomHandler>().RoomBPos - this.gameObject.GetComponent<RoomHandler>().RoomAPos);
        Vector3 newDir = originalDir; // Removed to test

        GameObject snowball = Instantiate(snowballPrefab, newPos, Quaternion.identity);
        snowball.GetComponent<Rigidbody>().AddForce(newDir * 400);
    }
}
