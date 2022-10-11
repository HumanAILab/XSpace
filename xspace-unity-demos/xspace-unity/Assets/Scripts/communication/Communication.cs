using UnityEngine;
using Moulin.DDP;
using UnityEngine.Events;
using HoloToolkit.Unity;
using HoloToolkit.Examples.SpatialUnderstandingFeatureOverview;

public class Communication : MonoBehaviour {
    public string serverUrl = "ws://localhost:3000/websocket";
    public UnityEvent OnDBStart;

    public string userKey = "";
    public GameObject originObject;

    public Vector3 originPosition;

    private DdpConnection ddpConnection;

    private LocalDB localDB;
    private int frames;

    public bool connected;
    public bool calledAddhead;
    
    private void Start () {

        connected = false;
        calledAddhead = false;

        Connect();
        originPosition = originObject.transform.position;
        frames = 0;
    }

    private void Update()
    {
        // TEMP: change later (TODO)
        if (!calledAddhead && connected && (Time.frameCount % 10 == 0))
        {
            AddHead();
            calledAddhead = true;
        }

        // update remote head position 
        // TODO: Update to use coroutine?
        if ((Time.frameCount % 10 == 0) && (userKey != ""))
        {
            UpdateHead();
        }
    }

    public virtual JsonObjectCollection GetCollection(string name)
    {
        Debug.Log("old version");
        if (localDB == null) return null;
        return (JsonObjectCollection)localDB.GetCollection(name);
    }

    public virtual void SetupDB() {
        localDB = new LocalDB((db, collectionName) => {
            return new JsonObjectCollection(db, collectionName);
        }, ddpConnection);
        OnDBStart.Invoke();
    }

    public virtual void Connect()
    {
        Debug.Log("connecting to " + serverUrl);
        ddpConnection = new DdpConnection(serverUrl);
        ddpConnection.OnDebugMessage += (string message) =>
        {
            Debug.Log(message);
        };
        ddpConnection.OnConnected += (DdpConnection connection) => {
            Debug.Log("connected!");
            ddpConnection.Subscribe("geometry");
            ddpConnection.Subscribe("userSpace");
            ddpConnection.Subscribe("systemState");
            ddpConnection.Subscribe("users");

            connected = true;
        };

        ddpConnection.OnError += DdpConnection_OnError;
        SetupDB();
        ddpConnection.Connect();
    }

    /* USER COLLECTION CALLS */

    public virtual void AddHead()
    {
        Vector3 headPos = 10f * (CameraCache.Main.transform.position - originPosition);

        JSONObject positionArr = JSONObject.Create(JSONObject.Type.ARRAY);
        positionArr.Add(-headPos.x);
        positionArr.Add(headPos.y);
        positionArr.Add(headPos.z);

        JSONObject rotationArr = JSONObject.Create(JSONObject.Type.ARRAY);
        rotationArr.Add(0.0f);
        rotationArr.Add(-0.0f);
        rotationArr.Add(-0.0f);

        JSONObject scaleArr = JSONObject.Create(JSONObject.Type.ARRAY);
        scaleArr.Add(0.1f);
        scaleArr.Add(0.1f);
        scaleArr.Add(0.1f);

        MethodCall methodCall = ddpConnection.Call("users.add",
            positionArr,
            rotationArr,
            scaleArr);

        methodCall.OnUpdated = (MethodCall obj) => {
            // Debug.Log("Updated, methodId=" + obj.id);
        };
        methodCall.OnResult = (MethodCall obj) => {
            Debug.Log("Result = " + obj.result);

            userKey = obj.result.str;
            SystemState.Instance.SysState = SysState.Connected;
        };
    }

    public virtual void UpdateHead()
    {
        Vector3 newPosition = 10f * (CameraCache.Main.transform.position - originPosition);
        Vector3 newRotation = Mathf.Deg2Rad * CameraCache.Main.transform.rotation.eulerAngles;

        JSONObject positionArr = JSONObject.Create(JSONObject.Type.ARRAY);
        positionArr.Add(-newPosition.x);
        positionArr.Add(newPosition.y);
        positionArr.Add(newPosition.z);

        MethodCall methodPositionCall = ddpConnection.Call("users.move", JSONObject.CreateStringObject(userKey), positionArr);
        methodPositionCall.OnUpdated = (MethodCall obj) => {
            // Debug.Log("Updated, methodId=" + obj.id);
        };
        methodPositionCall.OnResult = (MethodCall obj) => {
            // Debug.Log("Result = " + obj.result);
        };

        JSONObject rotationArr = JSONObject.Create(JSONObject.Type.ARRAY);
        rotationArr.Add(newRotation.x);
        rotationArr.Add(-newRotation.y);
        rotationArr.Add(-newRotation.z);

        MethodCall methodRotationCall = ddpConnection.Call("users.rotate", JSONObject.CreateStringObject(userKey), rotationArr);
        methodRotationCall.OnUpdated = (MethodCall obj) => {
            // Debug.Log("Updated, methodId=" + obj.id);
        };
        methodRotationCall.OnResult = (MethodCall obj) => {
            // Debug.Log("Result = " + obj.result);
        };
    }

    /* USERSPACE COLLECTION CALLS */

    public void SendPlane(Transform destinationPlaneTransform)
    {
        Debug.Log("Sending a surface plane!!");
        Vector3 planePos = 10f * (destinationPlaneTransform.position - originPosition);
        Vector3 planeScale = destinationPlaneTransform.lossyScale;
        Vector3 planeRot = Mathf.Deg2Rad * destinationPlaneTransform.eulerAngles;

        JSONObject positionArr = JSONObject.Create(JSONObject.Type.ARRAY);
        positionArr.Add(-planePos.x);
        positionArr.Add(planePos.y);
        positionArr.Add(planePos.z);

        JSONObject rotationArr = JSONObject.Create(JSONObject.Type.ARRAY);
        rotationArr.Add(planeRot.x);
        rotationArr.Add(-planeRot.y);
        rotationArr.Add(-planeRot.z);

        JSONObject scaleArr = JSONObject.Create(JSONObject.Type.ARRAY);
        scaleArr.Add(planeScale.x);
        scaleArr.Add(planeScale.y);
        scaleArr.Add(planeScale.z);

        MethodCall methodCall = ddpConnection.Call("geometry.add",
            JSONObject.CreateStringObject("surface"),
            positionArr,
            rotationArr,
            scaleArr);

        methodCall.OnUpdated = (MethodCall obj) => {
            Debug.Log("Updated, methodId=" + obj.id);
        };
    }

    public virtual void SendMesh(string objString, Transform objTransform)
    {
        Debug.Log("Sending a custom mesh!!");

        Vector3 pos = 10f * (objTransform.position - originPosition);
        Vector3 scale = 10f * objTransform.lossyScale;
        Vector3 rot = Mathf.Deg2Rad * objTransform.eulerAngles;

        JSONObject positionArr = JSONObject.Create(JSONObject.Type.ARRAY);
        positionArr.Add(-pos.x);
        positionArr.Add(pos.y);
        positionArr.Add(pos.z);

        JSONObject rotationArr = JSONObject.Create(JSONObject.Type.ARRAY);
        rotationArr.Add(rot.x);
        rotationArr.Add(-rot.y);
        rotationArr.Add(-rot.z);

        JSONObject scaleArr = JSONObject.Create(JSONObject.Type.ARRAY);
        scaleArr.Add(scale.x);
        scaleArr.Add(scale.y);
        scaleArr.Add(scale.z);

        MethodCall methodCall = ddpConnection.Call("userSpace.add",
            JSONObject.CreateStringObject("mesh"),
            JSONObject.CreateStringObject(objString),
            positionArr,
            rotationArr,
            scaleArr);
    }

    /* SYSTEM STATE COLLECTION CALLS */

    public virtual void ClaimScan(string entryId)
    {
        Debug.Log("wrong claim!");
        MethodCall methodCall = ddpConnection.Call("systemState.update",
            JSONObject.CreateStringObject(entryId),
            JSONObject.Create(true),
            JSONObject.Create(false),
            JSONObject.CreateStringObject(userKey));
    }

    public virtual void ScanFinished(string entryId)
    {
        MethodCall methodCall = ddpConnection.Call("systemState.update",
            JSONObject.CreateStringObject(entryId),
            JSONObject.Create(false),
            JSONObject.Create(true),
            JSONObject.CreateStringObject(userKey));
    }

    /* GEOMETRY COLLECTION CALLS */

    public void MoveObj(string objectId, Vector3 newPosition)
    {
        JSONObject positionArr = JSONObject.Create(JSONObject.Type.ARRAY);
        positionArr.Add(-newPosition.x);
        positionArr.Add(newPosition.y);
        positionArr.Add(newPosition.z);

        MethodCall methodCall = ddpConnection.Call("geometry.move", JSONObject.CreateStringObject(objectId), positionArr);
        methodCall.OnUpdated = (MethodCall obj) => {
            // Debug.Log("Updated, methodId=" + obj.id);
        };
        methodCall.OnResult = (MethodCall obj) => {
            // Debug.Log("Result = " + obj.result);
        };
    }

    public void RotateObj(string objectId, Vector3 newRotation)
    {
        JSONObject positionArr = JSONObject.Create(JSONObject.Type.ARRAY);
        positionArr.Add(newRotation.x);
        positionArr.Add(-newRotation.y);
        positionArr.Add(-newRotation.z);

        MethodCall methodCall = ddpConnection.Call("geometry.rotate", JSONObject.CreateStringObject(objectId), positionArr);
        methodCall.OnUpdated = (MethodCall obj) => {
            // Debug.Log("Updated, methodId=" + obj.id);
        };
        methodCall.OnResult = (MethodCall obj) => {
            // Debug.Log("Result = " + obj.result);
        };
    }

    // for sending selected status to meteor (currently not used)
    public void SelectObj(string objectId)
    {
        MethodCall methodCall = ddpConnection.Call("geometry.selected", JSONObject.CreateStringObject(objectId));
        methodCall.OnUpdated = (MethodCall obj) => {
            // Debug.Log("Updated, methodId=" + obj.id);
        };
        methodCall.OnResult = (MethodCall obj) => {
            // Debug.Log("Result = " + obj.result);
        };
    }

    // for sending selected status to meteor (currently not used)
    public void DeselectObj(string objectId)
    {
        MethodCall methodCall = ddpConnection.Call("geometry.deselected", JSONObject.CreateStringObject(objectId));
        methodCall.OnUpdated = (MethodCall obj) => {
            // Debug.Log("Updated, methodId=" + obj.id);
        };
        methodCall.OnResult = (MethodCall obj) => {
            // Debug.Log("Result = " + obj.result);
        };
    }

    /* ERROR */

    private void DdpConnection_OnError(DdpError error)
    {

        Debug.Log("ERROR " + error.errorCode + " - " + error.errorType + " - " + error.reason);
    }

}
