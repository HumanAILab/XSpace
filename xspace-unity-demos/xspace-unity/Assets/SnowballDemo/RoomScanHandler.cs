using Moulin.DDP;
using System.Collections;
using System.Linq;
using System.Collections.Generic;
using UnityEngine;

public class RoomScanHandler : MonoBehaviour {
    public Communication com;

    [Tooltip("Space Object")]
    public GameObject originObj;
    private Transform originTransform;

    private JsonObjectCollection roomScanCollection;

    private ObjImporter objImporter;

    // All known room scan geometry 
    Dictionary<string, GameObject> geometries = new Dictionary<string, GameObject>();

    // note that GameObject creation and manipulation needs to be called from the main thread, so we
    // fill lists and do the heavy-lifting in the update function
    private Queue<KeyValuePair<string, JSONObject>> createGeom = new Queue<KeyValuePair<string, JSONObject>>();
    private Queue<KeyValuePair<string, JSONObject>> updateGeom = new Queue<KeyValuePair<string, JSONObject>>();
    private Queue<string> removeGeom = new Queue<string>();

    // Remote room material 
    public Material material; 

    // Use this for initialization
    void Start () {
        // Set origin 
        originTransform = originObj.transform;

        // Instantiate an objImporter object
        objImporter = new ObjImporter();

        roomScanCollection = com.GetCollection("roomScans");
        if (roomScanCollection == null)
        {
            com.OnDBStart.AddListener(() =>
            {
                roomScanCollection = com.GetCollection("roomScans");
                SetupRoomScanCollection();
            });
        } else
        {
            SetupRoomScanCollection();
        }
    }

    private void SetupRoomScanCollection()
    {
        lock (createGeom)
        {
            roomScanCollection.OnAdded += (id, fields) =>
            {
                createGeom.Enqueue(new KeyValuePair<string, JSONObject>(id, fields));
            };
        }
        lock (updateGeom)
        {
            roomScanCollection.OnChanged += (id, fields, cleared) =>
            {
                updateGeom.Enqueue(new KeyValuePair<string, JSONObject>(id, fields));
            };
        }
        lock (removeGeom)
        {
            roomScanCollection.OnRemoved += (id) =>
            {
                removeGeom.Enqueue(id);
            };
        }
    }
	
	// Update is called once per frame
	void Update () {
        KeyValuePair<string, JSONObject> data;
        string idData; 

		lock (createGeom)
        {
            while (createGeom.Count > 0)
            {
                data = createGeom.Dequeue();
                Debug.Log("Loading room scan part");
                // TODO: Check against clientID  (Import only remote mesh parts)
                // Construct model from objString 
                // TODO: It is unclear whether the following line will work
                Mesh roomScanPartMesh = objImporter.ImportMesh(data.Value.GetField("objString").ToString()); 
                GameObject roomScanPartObj = new GameObject("roomPart");
                // Front 
                GameObject front = new GameObject("front");
                MeshRenderer frontRenderer = front.AddComponent<MeshRenderer>();
                frontRenderer.material = material;
                MeshFilter frontFilter = front.AddComponent<MeshFilter>();
                frontFilter.mesh = Instantiate(roomScanPartMesh);
                front.transform.parent = roomScanPartObj.transform;
                // Back
                GameObject back = new GameObject("back");
                MeshRenderer backRenderer = back.AddComponent<MeshRenderer>();
                backRenderer.material = material;
                MeshFilter backFilter = back.AddComponent<MeshFilter>();
                Mesh backMesh = Instantiate(roomScanPartMesh);
                // Invert normals
                for (int i = 0; i < backMesh.normals.Length; i++)
                    backMesh.normals[i] = -backMesh.normals[i];
                // Reverse triangle order 
                backMesh.triangles = backMesh.triangles.Reverse().ToArray();
                backFilter.mesh = backMesh;
                back.transform.parent = roomScanPartObj.transform;

                // Position and orient part
                float[] roomScanPartPosition = new float[3];
                int idx = 0;
                JSONObject posJSON = data.Value.GetField("position");
                foreach (JSONObject pos in posJSON.list)
                {
                    roomScanPartPosition[idx++] = pos.n;
                }
                roomScanPartObj.transform.SetParent(this.transform);
                roomScanPartObj.transform.position = new Vector3(
                    roomScanPartPosition[0], roomScanPartPosition[1], roomScanPartPosition[2]
                );
                float[] roomScanPartRotation = new float[3];
                idx = 0;
                JSONObject rotJSON = data.Value.GetField("rotation");
                foreach (JSONObject rot in rotJSON.list)
                {
                    roomScanPartRotation[idx++] = rot.n;
                }
                roomScanPartObj.transform.eulerAngles = new Vector3(
                    roomScanPartRotation[0] * Mathf.Rad2Deg,
                    roomScanPartRotation[1] * Mathf.Rad2Deg,
                    roomScanPartRotation[2] * Mathf.Rad2Deg
                );
                float[] roomScanPartScale = new float[3];
                idx = 0;
                JSONObject scaleJSON = data.Value.GetField("scale");
                foreach (JSONObject scale in scaleJSON.list)
                {
                    roomScanPartScale[idx++] = scale.n;
                }
                roomScanPartObj.transform.localScale = new Vector3(
                    roomScanPartScale[0], roomScanPartScale[1], roomScanPartScale[2]
                );

                // TODO: Slicing 
                // Slicing procedure involves instantiating a slice plane
                // Plane slicePlane = new Plane(new Vector3(-1.0f, 0.0f, 1.0f), new Vector3(0.0f, 0.0f, 0.0f));
                // and calling the following method
                // Slicer.slice(roomA, slicePlane);
            }
        }
        lock (updateGeom)
        {
            while (updateGeom.Count > 0)
            {
                data = updateGeom.Dequeue();
                Debug.Log("Updating room scan part");
            }
        }
        lock (removeGeom)
        {
            while (removeGeom.Count > 0)
            {
                idData = removeGeom.Dequeue();
                Debug.Log("Removing room scan part");
            }
        }
    }
}
