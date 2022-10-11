using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Moulin.DDP;
using System;
using HoloToolkit.Unity.InputModule;

public class GeometryHandler : MonoBehaviour
{
    public Communication com;

    [Tooltip("Type of geometry (e.g. 'cube')")]
    string Type = "geometry";

    [Tooltip("Prefab for geometry")]
    public GameObject cubePrefab;
    public GameObject surfacePrefab;
    public GameObject textPrefab;
    public GameObject linePrefab;

    public GameObject originObj;

    private JsonObjectCollection geometryCollection;
    private Transform originTransform;

    // all known geometry
    Dictionary<string, GameObject> geometries = new Dictionary<string, GameObject>();

    // note that GameObject creation and manipulation needs to be called from the main thread, so we
    // fill lists and do the heavy-lifting in the update function
    private Queue<KeyValuePair<string, JSONObject>> createGeom = new Queue<KeyValuePair<string, JSONObject>>();
    private Queue<KeyValuePair<string, JSONObject>> updateGeom = new Queue<KeyValuePair<string, JSONObject>>();
    private Queue<string> removeGeom = new Queue<string>();

    private void Start()
    {
        Type = "geometry";
        originTransform = originObj.transform;

        geometryCollection = com.GetCollection("geometry");
        if (geometryCollection == null)
        {
            com.OnDBStart.AddListener(() => {
                geometryCollection = com.GetCollection("geometry");
                SetupGeometryCollection();
            });
        }
        else
        {
            SetupGeometryCollection();
        }
    }

    private void SetupGeometryCollection()
    {
        lock (createGeom)
        {
            geometryCollection.OnAdded += (id, fields) =>
            {
                if (!fields.HasField("type")) return;
                string GeomType = fields.GetField("type").str;
                createGeom.Enqueue(new KeyValuePair<string, JSONObject>(id, fields));
            };
        }
        lock (updateGeom)
        {
            geometryCollection.OnChanged += (id, fields, cleared) =>
            {
                // Debug.Log("Change " + id + " - " + fields);
                updateGeom.Enqueue(new KeyValuePair<string, JSONObject>(id, fields));
            };
        }
        lock (removeGeom)
        {
            geometryCollection.OnRemoved += (id) =>
            {
                Debug.Log("Remove " + id);
                removeGeom.Enqueue(id);
            };
        }
    }

    private void Update()
    {
        KeyValuePair<string, JSONObject> data;
        string idData;
        string type;
        GameObject obj;
        GameObject textChild;

        lock (createGeom)
        {
            while (createGeom.Count > 0)
            {
                data = createGeom.Dequeue();
                type = data.Value.GetField("type").str;

                if (type == "head")
                {
                    return; // no need to create head objects in hololens session
                }
                else if (type == "cube")
                {
                    obj = Instantiate(cubePrefab, originTransform.localPosition, Quaternion.identity);

                    geometries.Add(data.Key, obj);

                    geometries[data.Key].GetComponent<ObjType>().objectKey = data.Key;
                    geometries[data.Key].GetComponent<ScaleRotSys>().com = com;

                    geometries[data.Key].GetComponent<Dragging>().com = com;
                    geometries[data.Key].GetComponent<Dragging>().originObj = originObj;

                    UpdateGeometryPosition(data.Value.GetField("position"), obj, type);
                }
                else if (type == "surface")
                {
                    obj = Instantiate(surfacePrefab, originTransform.localPosition, Quaternion.identity);

                    // create and position text object
                    textChild = Instantiate(textPrefab, originTransform.localPosition, Quaternion.identity);
                    textChild.transform.parent = obj.transform;
                    textChild.transform.localPosition = new Vector3(
                        transform.localPosition.x - 0.4f,
                        transform.localPosition.y + 0.4f, textChild.transform.position.z);

                    geometries.Add(data.Key, obj);

                    geometries[data.Key].GetComponent<ObjType>().objectKey = data.Key;
                    geometries[data.Key].GetComponent<ScaleRotSys>().com = com;

                    geometries[data.Key].GetComponent<Dragging>().com = com;
                    geometries[data.Key].GetComponent<Dragging>().originObj = originObj;

                    UpdateGeometryPosition(data.Value.GetField("position"), obj, type);
                }
                else if (type == "connection")
                {
                    obj = Instantiate(linePrefab, originTransform.localPosition, Quaternion.identity);
                    obj.GetComponent<Line>().gameObject1 = geometries[data.Value.GetField("objA").str];
                    obj.GetComponent<Line>().gameObject2 = geometries[data.Value.GetField("objB").str];

                    geometries.Add(data.Key, obj);
                }
            }
        }
        lock (updateGeom)
        {
            while (updateGeom.Count > 0)
            {
                data = updateGeom.Dequeue();
                if (!geometries.ContainsKey(data.Key)) return;

                type = geometries[data.Key].GetComponent<ObjType>().type;
                Debug.Log(type);

                UpdateGeometryPosition(data.Value.GetField("position"), geometries[data.Key], type);
                UpdateGeometryRotation(data.Value.GetField("rotation"), geometries[data.Key], type);
                UpdateGeometryScale(data.Value.GetField("scale"), geometries[data.Key], type);

                UpdateGeometryText(data.Value.GetField("text"), geometries[data.Key], type);
                UpdateGeometrySelected(data.Value.GetField("isSelected"), geometries[data.Key], type);
            }
        }
        lock (removeGeom)
        {
            while (removeGeom.Count > 0)
            {
                idData = removeGeom.Dequeue();
                if (!geometries.ContainsKey(idData)) return;
                Destroy(geometries[idData]);
            }
        }
    }

    public void UpdateGeometryPosition(JSONObject position, GameObject obj, string objType)
    {
        if (position == null) return;
        obj.transform.position = 0.1f * new Vector3(
            -position[0].f,
            position[1].f,
            position[2].f) + originTransform.localPosition;
    }

    public void UpdateGeometryRotation(JSONObject rotation, GameObject obj, string objType)
    {
        if (rotation == null) return;
        obj.transform.rotation = Quaternion.Euler(
            rotation[0].f * Mathf.Rad2Deg,
            -rotation[1].f * Mathf.Rad2Deg,
            -rotation[2].f * Mathf.Rad2Deg);
    }
    public void UpdateGeometryScale(JSONObject scale, GameObject obj, string objType)
    {
        if (scale == null) return;
        if (objType == "surface")
        {
            obj.transform.localScale = new Vector3(
            0.2f * scale[0].f,
            0.2f * scale[1].f,
            0.01f);
        }
        else if (objType == "cube")
        {
            obj.transform.localScale = 0.1f * new Vector3(
            scale[0].f,
            scale[1].f,
            scale[2].f);
        }
    }
    public void UpdateGeometryText(JSONObject textIn, GameObject obj, string objType)
    {
        if (objType == "surface")
        {
            if (textIn == null) return;
            string newText = textIn.str.Replace("\\n", "\n");
            obj.GetComponentInChildren<TextMesh>().text = newText;
        }
        
    }
    public void UpdateGeometrySelected(JSONObject selected, GameObject obj, string objType)
    {
        if (selected == null) return;

        if (selected.str == "true")
        {
            Debug.Log("draw selection box");
            // draw the selection box
            // TODO: different color for remote user selectio, pass in a different param here
            obj.GetComponent<ScaleRotSys>().DrawSelectionBox(false);
        }
        else
        {
            Debug.Log("delete selection box");
            // delete the selection box (all children except for the textmesh)
            obj.GetComponent<ScaleRotSys>().DeleteAllChildren();
        }
    }
}