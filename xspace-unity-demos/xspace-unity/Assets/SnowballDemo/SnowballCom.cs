using HoloToolkit.Examples.SpatialUnderstandingFeatureOverview;
using HoloToolkit.Unity;
using Moulin.DDP;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

public class SnowballCom : Communication {

    // Commented out variables are inherited from the base class 'Communication' :)

    //public string serverUrl = "ws://localhost:3000/websocket";
    //public UnityEvent OnDBStart;
    private DdpConnection ddpConnection;
    private LocalDB localDB;

    //public string userKey = "";

    //public GameObject originObject;
    //private Vector3 originPosition;

    //private bool connected;
    //private bool calledAddhead;

    // Use this for initialization
    void Start ()
    {
        originPosition = originObject.transform.position;

        connected = false;
        calledAddhead = false;

        Connect();   
    }
	
	// Update is called once per frame
	void Update ()
    {
        // TEMP: change later (TODO)
        if (!calledAddhead && connected && (Time.frameCount % 10 == 0))
        {
            AddHead();
            calledAddhead = true;
        }

        // update remote head position 
        // TODO: Update to only call once mesh has been sent
        if ((Time.frameCount % 10 == 0) && (userKey != ""))
        {
            UpdateHead();
        }
    }

    public override JsonObjectCollection GetCollection(string name)
    {
        if (localDB == null)
        {
            Debug.Log("localdb null");
            return null;
        }
        Debug.Log(localDB);
        return (JsonObjectCollection)localDB.GetCollection(name);
    }

    public override void SetupDB()
    {
        localDB = new LocalDB((db, collectionName) => {
            return new JsonObjectCollection(db, collectionName);
        }, ddpConnection);
        OnDBStart.Invoke();
    }

    public override void Connect()
    {
        Debug.Log("connecting to " + serverUrl);
        ddpConnection = new DdpConnection(serverUrl);
        ddpConnection.OnDebugMessage += (string message) =>
        {
            Debug.Log(message);
        };
        ddpConnection.OnConnected += (DdpConnection connection) => {
            Debug.Log("connected!");

            // SUBSCRIBE TO COLLECTIONS HERE
            ddpConnection.Subscribe("systemState");
            ddpConnection.Subscribe("players");
            ddpConnection.Subscribe("rooms");
            ddpConnection.Subscribe("roomScans");
            ddpConnection.Subscribe("alignment");
            ddpConnection.Subscribe("projectiles");

            connected = true;
        };

        ddpConnection.OnError += DdpConnection_OnError;
        SetupDB();
        ddpConnection.Connect();
    }

    /* USER COLLECTION CALLS */

    public override void AddHead()
    {
        Vector3 headPos = (CameraCache.Main.transform.position - originPosition);

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

        MethodCall methodCall = ddpConnection.Call("players.insert",
            JSONObject.CreateStringObject("A"),
            JSONObject.CreateStringObject("A"),
            JSONObject.Create(true), // isHL
            positionArr,
            rotationArr);

        methodCall.OnUpdated = (MethodCall obj) => {
            Debug.Log("Updated, methodId=" + obj.id);
        };
        methodCall.OnResult = (MethodCall obj) => {
            Debug.Log("Result = " + obj.result);

            userKey = obj.result.str;
            SystemStateMulti.Instance.SysStateMulti = SysStateMulti.Connected;
        };
    }

    public override void UpdateHead()
    {
        Vector3 newPosition = (CameraCache.Main.transform.position - originPosition);
        Vector3 newRotation = Mathf.Deg2Rad * CameraCache.Main.transform.rotation.eulerAngles;

        JSONObject positionArr = JSONObject.Create(JSONObject.Type.ARRAY);
        positionArr.Add(-newPosition.x);
        positionArr.Add(newPosition.y);
        positionArr.Add(newPosition.z);

        MethodCall methodPositionCall = ddpConnection.Call("players.move", JSONObject.CreateStringObject(userKey), positionArr);
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

        MethodCall methodRotationCall = ddpConnection.Call("players.rotate", JSONObject.CreateStringObject(userKey), rotationArr);
        methodRotationCall.OnUpdated = (MethodCall obj) => {
            // Debug.Log("Updated, methodId=" + obj.id);
        };
        methodRotationCall.OnResult = (MethodCall obj) => {
            // Debug.Log("Result = " + obj.result);
        };
    }

    /* SYSTEM STATE COLLECTION CALLS */

    // sysState.update: function(_id, room, scanningStatus, doneStatus, headKey)
    public override void ClaimScan(string entryId)
    {
        Debug.Log("correct version called!");
        MethodCall methodCall = ddpConnection.Call("systemState.update",
            JSONObject.CreateStringObject("A"),
            JSONObject.Create(true),
            JSONObject.Create(false),
            JSONObject.CreateStringObject(userKey));
    }

    public void ClaimScan2(string entryId)
    {
        Debug.Log("correct version called!");
        MethodCall methodCall = ddpConnection.Call("systemState.update",
            JSONObject.CreateStringObject("A"),
            JSONObject.Create(true),
            JSONObject.Create(false),
            JSONObject.CreateStringObject(userKey));
    }

    public override void ScanFinished(string entryId)
    {
        MethodCall methodCall = ddpConnection.Call("systemState.update",
            JSONObject.CreateStringObject("A"),
            JSONObject.Create(false),
            JSONObject.Create(true),
            JSONObject.CreateStringObject(userKey));

        MethodCall methodCall2 = ddpConnection.Call("room.updateDone",
            JSONObject.CreateStringObject("A"),
            JSONObject.Create(true));
    }

    /* USERSPACE COLLECTION CALLS */

    public override void SendMesh(string objString, Transform objTransform)
    {
        Debug.Log("Sending a custom mesh!!");

        Vector3 pos = (objTransform.position - originPosition);
        Vector3 scale = objTransform.lossyScale;
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

        MethodCall methodCall = ddpConnection.Call("roomScans.add",
            JSONObject.CreateStringObject("A"),
            JSONObject.CreateStringObject(objString),
            positionArr,
            rotationArr,
            scaleArr);
    }

    /* ADD CUSTOM SEND DATA HERE! */
    public void RetrieveMesh()
    {

    }

    /* PROJECTILES */

    // worldId, position, direction
    public void SendProjectile(Vector3 pos, Vector3 dir)
    {
        JSONObject positionArr = JSONObject.Create(JSONObject.Type.ARRAY);
        positionArr.Add(-pos.x);
        positionArr.Add(pos.y);
        positionArr.Add(pos.z);

        JSONObject directionArr = JSONObject.Create(JSONObject.Type.ARRAY);
        directionArr.Add(-dir.x);
        directionArr.Add(dir.y);
        directionArr.Add(dir.z);

        MethodCall methodCall = ddpConnection.Call("projectiles.insert",
            JSONObject.CreateStringObject("A"),
            positionArr,
            directionArr);
    }

    /* ERROR */

    private void DdpConnection_OnError(DdpError error)
    {

        Debug.Log("ERROR " + error.errorCode + " - " + error.errorType + " - " + error.reason);
    }
}
