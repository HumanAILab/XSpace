using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ObjectData : MonoBehaviour {

    public bool draggingEnabled;
    public bool resizingEnabled;
    public bool rotatingEnabled;

    public ObjectType objectType;

    // Use this for initialization
    void Start () {
        draggingEnabled = false;
        resizingEnabled = false;
        rotatingEnabled = false;
	}
	
	// Update is called once per frame
	void Update () {
		
	}
}
