using HoloToolkit.Sharing;
using HoloToolkit.Sharing.Tests;
using HoloToolkit.Unity.InputModule;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DeleteButtonScript : MonoBehaviour, IInputClickHandler
{

	// Use this for initialization
	void Start () {

        // We care about getting updates for deleted objects.
        CustomMessages.Instance.MessageHandlers[CustomMessages.TestMessageID.DeleteObject] = this.OnDeleteObject;
    }
	
	// Update is called once per frame
	void Update () {
		
	}

    void IInputClickHandler.OnInputClicked(InputClickedEventData eventData)
    {

        ScaleRotManager.Instance.selectedObject.GetComponent<HandDraggable>().IsDraggingEnabled = false;
        ScaleRotManager.Instance.selectedObject.GetComponent<HandResize>().resizingEnabled = false;
        ScaleRotManager.Instance.selectedObject.GetComponent<HandRotate>().rotatingEnabled = false;

        StartCoroutine(HttpManager.DeleteObject(this.gameObject.GetInstanceID()));

        // Debug.Log("sending message");
        CustomMessages.Instance.SendObjectDelete(ScaleRotManager.Instance.selectedObject.GetComponent<DefaultSyncModelAccessor>().SyncModel.Guid);

        // Debug.Log("Delete sent");

        Destroy(ScaleRotManager.Instance.selectedObject);

        // Debug.Log("Object destroyed");

        // reset globals
        ScaleRotManager.Instance.isObjectSelected = false;
        ScaleRotManager.Instance.selectedObject = null;

        // Debug.Log("Globals reset");
    }

    /// When a remote system has a delete for us, we'll get it here.
    public void OnDeleteObject(NetworkInMessage msg)
    {
        // We read the user ID but we don't use it here.
        msg.ReadInt64();

        // Vector3 position = CustomMessages.Instance.ReadVector3(msg);
        string guid = CustomMessages.Instance.ReadTag(msg);

        /*
        Collider[] colliders;
        if ((colliders = Physics.OverlapSphere(position, 1f)).Length > 0.5) //Presuming the object you are testing also has a collider 0 otherwise
        {
            foreach (var collider in colliders)
            {
                var go = collider.gameObject;        // This is the game object you collided with
                if (go == this.gameObject) continue; // Skip the object itself
                Destroy(go);                         // Do something
                break;
            }
        }
        */

        foreach (GameObject go in Resources.FindObjectsOfTypeAll(typeof(GameObject)) as GameObject[])
        {
            if (go.GetComponent<DefaultSyncModelAccessor>() != null)
            {
                // and it doesn't already have the sys
                if (guid == go.GetComponent<DefaultSyncModelAccessor>().SyncModel.Guid.ToString())
                {
                    Destroy(go);
                    break;
                }
            }
        }
    }

}
