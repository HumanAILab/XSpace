using HoloToolkit.Sharing;
using HoloToolkit.Sharing.Spawning;
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SyncOriginSpawner : MonoBehaviour {

    [SerializeField]
    public PrefabSpawnManager spawnManager;

    private Transform spawnParentTransform;

    public event EventHandler OnOriginCreated;

    public void SpawnBasicSyncObject()
    {
        var direction = Camera.main.transform.forward;
        var origin = Camera.main.transform.position;
        var position = origin + direction * 1.5f;
        position = this.gameObject.transform.InverseTransformPoint(position);

        Quaternion rotation = UnityEngine.Random.rotation;

        var spawnedObject = new SyncSpawnedObject();
        spawnManager.Spawn(spawnedObject, position, rotation, spawnParentTransform.gameObject, "SpawnedObject", false);

        Debug.Log("send origin event");
        OnOriginCreated(this, EventArgs.Empty);
    }

    private void Awake()
    {
        if (spawnManager == null)
        {
            Debug.LogError("You need to reference the spawn manager on SyncObjectSpawner.");
        }

        spawnParentTransform = transform;
        SpawnBasicSyncObject();
    }

    // Use this for initialization
    void Start () {

    }

    // Update is called once per frame
    void Update () {
		
	}
}
