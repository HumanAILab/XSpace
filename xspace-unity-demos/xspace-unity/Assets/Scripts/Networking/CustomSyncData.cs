using HoloToolkit.Sharing.Spawning;
using HoloToolkit.Sharing.SyncModel;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CustomSyncData : SyncObject {

    [SyncData]
    public SyncFloat floatValue;

    [SyncData]
    public SyncArray<SyncObject> selectedStatusArray;

    // Use this for initialization
    void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		
	}
}
