using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using HoloToolkit.Unity.InputModule;
using HoloToolkit.Sharing;
using HoloToolkit.Sharing.Spawning;
using System;

public class CubeManager : MonoBehaviour
{
    public GameObject blueCubePrefab;

    UnityEngine.XR.WSA.Input.GestureRecognizer recognizer;
    bool GazingAtObject;

    public PrefabSpawnManager spawnManager;

    // Use this for initialization
    void Start ()
    {
        GazingAtObject = false;

        // create recognizer and register tapped event
        recognizer = new UnityEngine.XR.WSA.Input.GestureRecognizer();
        recognizer.TappedEvent += Recognizer_TappedEvent;
        recognizer.StartCapturingGestures();
    }

    private void Recognizer_TappedEvent(UnityEngine.XR.WSA.Input.InteractionSourceKind source, int tapCount, Ray headRay)
    {
        // If we're networking...
        if (SharingStage.Instance.IsConnected)
        {
            if (!GazingAtObject)
            {
                // Make a new cube that is 2m away in direction of gaze but then get that position
                // relative to the object that we are attached to (which is world anchor'd across
                // our devices).
                var direction = headRay.direction;
                var origin = headRay.origin;
                var position = origin + direction * 2.0f;
                position = this.gameObject.transform.InverseTransformPoint(position);

                // Use the spawn manager to spawn a 'SyncSpawnedObject' at that position with
                // some random rotation, parent it off our gameObject, give it a base name (MyCube)
                // and do not claim ownership of it so it stays behind in the scene even if our
                // device leaves the session.
                this.spawnManager.Spawn(
                    new SyncSpawnedObject(),
                    position,
                    UnityEngine.Random.rotation,
                    this.gameObject,
                    "Cube",
                    false);
            }
        }
    }

    // Update is called once per frame
    void Update ()
    {
        if (GazeManager.Instance.HitObject == null)
        {
            GazingAtObject = false;
            // check if gazing at menu
        }
        else
        {
            GazingAtObject = true;
        }
        /// GazingAtObject = GazeManager.Instance.IsGazingAtObject;
    }
}
