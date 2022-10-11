using HoloToolkit.Unity.InputModule;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MoveButtonScript : MonoBehaviour, IInputClickHandler
{

	// Use this for initialization
	void Start () {

	}
	
	// Update is called once per frame
	void Update () {
		
	}

    void IInputClickHandler.OnInputClicked(InputClickedEventData eventData)
    {
        ScaleRotManager.Instance.selectedObjectMode = ObjectMode.Move;
        ScaleRotManager.Instance.selectedObject.GetComponent<HandDraggable>().IsDraggingEnabled = true;
        ScaleRotManager.Instance.selectedObject.GetComponent<HandResize>().resizingEnabled = false;
        ScaleRotManager.Instance.selectedObject.GetComponent<HandRotate>().rotatingEnabled = false;
    }

}
