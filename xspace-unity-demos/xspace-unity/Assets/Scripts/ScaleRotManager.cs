using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ScaleRotManager : MonoBehaviour {

    public static ScaleRotManager Instance { get; private set; }

    public Color selectorColor = new Color32(98, 99, 255, 128);

    public float handleScale = 1.0f;
    public PrimitiveType handleType;
    public Color scaleColor = new Color32(98, 159, 255, 128);

    public Color otherSelectorColor = new Color32(137, 137, 137, 128);

    GameObject selectorBox;
    GameObject scaleHandleBox;
    GameObject otherBox;

    public static Material selector;
    public static Material scale;

    public static Material otherSelector;

    public static PrimitiveType usedHandleType;
    public static float usedHandleScale;

    // globals for keeping track of selected object
    public bool isObjectSelected;
    public GameObject selectedObject;

    public ObjectMode selectedObjectMode;


    void Awake()
    {
        // Save a reference to the ScaleRotManager component as our singleton instance
        Instance = this;
    }

    // Use this for initialization
    void Start () {

        usedHandleType = handleType;
        usedHandleScale = handleScale;

        selectorBox = GameObject.Find("SelectorMaterial");
        scaleHandleBox = GameObject.Find("ScaleMaterial");
        otherBox = GameObject.Find("OtherMaterial");
        
        // set selector material
        selector = selectorBox.GetComponent<Renderer>().material;
        selector.color = selectorColor;

        otherSelector = otherBox.GetComponent<Renderer>().material;
        otherSelector.color = otherSelectorColor;

        // set scale material
        scale = scaleHandleBox.GetComponent<Renderer>().material;
        scale.color = scaleColor;

        // initialize globals
        isObjectSelected = false;
        selectedObject = null;
        // selectedObjectMode = ObjectMode.None;

	}

    void findAllGameObjects()
    {
        foreach (GameObject go in Resources.FindObjectsOfTypeAll(typeof(GameObject)) as GameObject[])
        {
            // if we can add the sys
            if (go.GetComponent<MeshFilter>() != null && go.tag != "ScaleRotSys"
                && go.tag != "Cursor" && go.tag != "origin")
            {
                // and it doesn't already have the sys
                if (go.GetComponent<ScaleRotSys>() == null)
                {
                    // then add it 
                    go.AddComponent<ScaleRotSys>();
                    go.tag = "ScaleRotSys";
                }
            }
        }
    }
	
	// fixed update
	void FixedUpdate () {

        // findAllGameObjects();
        // instead of running this loop just make sure all of the objects we will need to select already have this tag

	}
}
