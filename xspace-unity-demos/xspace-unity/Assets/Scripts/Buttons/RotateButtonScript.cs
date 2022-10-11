using HoloToolkit.Unity.InputModule;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class RotateButtonScript : MonoBehaviour, IInputClickHandler
{

	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		
	}

    void IInputClickHandler.OnInputClicked(InputClickedEventData eventData)
    {
        ScaleRotManager.Instance.selectedObjectMode = ObjectMode.Rotate;
        ScaleRotManager.Instance.selectedObject.GetComponent<HandDraggable>().IsDraggingEnabled = false;
        ScaleRotManager.Instance.selectedObject.GetComponent<HandResize>().resizingEnabled = false;
        ScaleRotManager.Instance.selectedObject.GetComponent<HandRotate>().rotatingEnabled = true;
    }

}
