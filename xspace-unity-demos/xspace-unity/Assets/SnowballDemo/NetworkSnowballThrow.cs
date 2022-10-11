using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using HoloToolkit.Unity.InputModule;
using HoloToolkit.Sharing;
using HoloToolkit.Sharing.Spawning;
using System;
using HoloToolkit.Unity;

public class NetworkSnowballThrow : MonoBehaviour
{

    public SnowballCom com;
    public GameObject snowballPrefab;

    UnityEngine.XR.WSA.Input.GestureRecognizer recognizer;
    bool GazingAtObject;

    // Use this for initialization
    void Start()
    {
        Debug.Log("Start snowball");

        GazingAtObject = false;

        // create recognizer and register tapped event
        recognizer = new UnityEngine.XR.WSA.Input.GestureRecognizer();
        // recognizer.TappedEvent += Recognizer_TappedEvent; // Removed because depreciated

        recognizer.Tapped += Recognizer_Tapped;
        recognizer.StartCapturingGestures();

    }

    private void Recognizer_Tapped(UnityEngine.XR.WSA.Input.TappedEventArgs obj)
    {
        Debug.Log("new tap");
        ThrowSnowball();
    }

    // Depreciated
    private void Recognizer_TappedEvent(UnityEngine.XR.WSA.Input.InteractionSourceKind source, int tapCount, Ray headRay) { }

    // Update is called once per frame
    void Update()
    {
        // For debugging in unity editor only
        if (Input.GetKeyDown("space"))
        {
            Debug.Log("space key was pressed");
            ThrowSnowball();
        }
    }

    private void ThrowSnowball()
    {
        Transform cameraTransform = CameraCache.Main.transform;

        // Make a new object that is 1m away in direction of gaze
        var direction = cameraTransform.forward;
        var origin = cameraTransform.position;
        var position = origin + direction * 1.0f;

        // Send snowball
        com.SendProjectile(position, direction);

        // Rigidbody snowballInstance;
        GameObject snowballInstance = Instantiate(snowballPrefab, position, Quaternion.identity);

        Vector3 throwDirection = new Vector3(direction.x, direction.y + 0.3f, direction.z);

        snowballInstance.GetComponent<Rigidbody>().AddForce(throwDirection * 400);

        Destroy(gameObject, 20); // If this object hasn't been destroyed in 20 seconds destroy it
    }
}
