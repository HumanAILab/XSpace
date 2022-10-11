using HoloToolkit.Sharing.Spawning;
using HoloToolkit.Unity.InputModule;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ScaleRotSys : MonoBehaviour, IInputClickHandler
{
    public Communication com;

    private GameObject srBoundingBox;
    private Renderer render;
    private Bounds srBounds;

    private Material srSelectorMaterial;
    private Material srScaleMaterial;

    private Material srOtherSelectorMaterial;
    private Material srOtherScaleMaterial;

    // false when there is not a bounding box
    bool drawing = false;

    // Use this for initialization
    void Start () {

        srBounds = new Bounds();

        // add materials
        srSelectorMaterial = ScaleRotManager.selector;
        srScaleMaterial = ScaleRotManager.scale;

        srOtherSelectorMaterial = ScaleRotManager.otherSelector;

        // http post right when object is created
        // StartCoroutine(HttpManager.CreateObject(this.gameObject));

    }
	
	// Update is called once per frame
	void Update () {
		
	}

    // used for testing in unity
    void OnMouseDown()
    {
        //OnSelect();
        
    }

    void IInputClickHandler.OnInputClicked(InputClickedEventData eventData)
    {
        if (!drawing)
        {
            // if there is already a selected object, un-select it
            if (ScaleRotManager.Instance.isObjectSelected)
            { 
                ScaleRotManager.Instance.selectedObject.GetComponent<ScaleRotSys>().DeleteAllChildren();
                ScaleRotManager.Instance.selectedObject.GetComponent<ScaleRotSys>().drawing = false;

                // disable dragging
                ScaleRotManager.Instance.selectedObject.GetComponent<Dragging>().SetDragging(false);

                // for sending selected status to meteor (currently no way to visualize so we comment out)
                com.DeselectObj(ScaleRotManager.Instance.selectedObject.GetComponent<ObjType>().objectKey);
            }

            // then draw box for this object
            DrawSelectionBox(true);
            drawing = true;

            // enable dragging
            this.gameObject.GetComponent<Dragging>().SetDragging(true);

            // for sending selected status to meteor (currently no way to visualize so we comment out)
            com.SelectObj(this.gameObject.GetComponent<ObjType>().objectKey);

            // set or re-set globals
            ScaleRotManager.Instance.isObjectSelected = true;
            ScaleRotManager.Instance.selectedObject = this.gameObject;
        }

        else if (drawing && this.gameObject.transform.childCount != 0 
                 && this.gameObject.tag != "Cursor")
        {
            DeleteAllChildren();
            drawing = false;

            // for sending selected status to meteor (currently no way to visualize so we comment out)
            com.DeselectObj(this.gameObject.GetComponent<ObjType>().objectKey);

            // disable dragging
            this.gameObject.GetComponent<Dragging>().SetDragging(false);

            // un-set globals
            ScaleRotManager.Instance.isObjectSelected = false;
            ScaleRotManager.Instance.selectedObject = null;
        }
    }

    public void DeleteAllChildren()
    {
        foreach (Transform child in this.transform)
        {
            if (child.gameObject.GetComponent<TextMesh>() == null)
            {
                Destroy(child.gameObject);
            }
        }
    }

    public void DrawSelectionBox(bool isOwner)
    {
        
        srBoundingBox = GameObject.CreatePrimitive(PrimitiveType.Cube);

        // set box position to current object position
        srBoundingBox.transform.position = this.gameObject.transform.position;
        srBoundingBox.transform.rotation = this.gameObject.transform.rotation;

        // set box parent to this
        srBoundingBox.transform.parent = this.gameObject.transform;

        // destroy box colider
        Destroy(srBoundingBox.GetComponent<Collider>());

        // get a reference to box renderer
        render = srBoundingBox.GetComponent<Renderer>();

        // using parent meshfilter, get reference to objects bounds
        srBounds = this.gameObject.GetComponent<MeshFilter>().mesh.bounds;

        // other bounds and object info
        float bounds_x = srBounds.size.x;
        float bounds_y = srBounds.size.y;
        float bounds_z = srBounds.size.z;

        Quaternion goRot = this.gameObject.transform.rotation;
        Vector3 boundsCenter = srBounds.center;

        // scale the box slightly larger than object
        srBoundingBox.transform.localScale = new Vector3(bounds_x * 1.1f, bounds_y * 1.1f, bounds_z * 1.1f);

        // create 8 corner points
        Vector3 srPoint0 = srBounds.min * 1.1f; // (0, 0, 0)
        Vector3 srPoint1 = srBounds.max * 1.1f; // (1, 1, 1)

        float scale_x = this.gameObject.transform.lossyScale.x;
        float scale_y = this.gameObject.transform.lossyScale.y;
        float scale_z = this.gameObject.transform.lossyScale.z;
        
        Vector3 srPoint2 = new Vector3(srPoint0.x * scale_x, srPoint0.y * scale_y, srPoint1.z * scale_z);
        Vector3 srPoint3 = new Vector3(srPoint0.x * scale_x, srPoint1.y * scale_y, srPoint0.z * scale_z);
        Vector3 srPoint4 = new Vector3(srPoint1.x * scale_x, srPoint0.y * scale_y, srPoint0.z * scale_z);

        Vector3 srPoint5 = new Vector3(srPoint1.x * scale_x, srPoint1.y * scale_y, srPoint0.z * scale_z);
        Vector3 srPoint6 = new Vector3(srPoint0.x * scale_x, srPoint1.y * scale_y, srPoint1.z * scale_z);
        Vector3 srPoint7 = new Vector3(srPoint1.x  * scale_x, srPoint0.y * scale_y, srPoint1.z * scale_z);

        srPoint0.x *= scale_x;
        srPoint0.y *= scale_y;
        srPoint0.z *= scale_z;

        srPoint1.x *= scale_x;
        srPoint1.y *= scale_y;
        srPoint1.z *= scale_z;

        // adjust for rotation
        RotatePointAroundPivot(ref srPoint0, boundsCenter, goRot);
        RotatePointAroundPivot(ref srPoint1, boundsCenter, goRot);
        RotatePointAroundPivot(ref srPoint2, boundsCenter, goRot);
        RotatePointAroundPivot(ref srPoint3, boundsCenter, goRot);
        RotatePointAroundPivot(ref srPoint4, boundsCenter, goRot);
        RotatePointAroundPivot(ref srPoint5, boundsCenter, goRot);
        RotatePointAroundPivot(ref srPoint6, boundsCenter, goRot);
        RotatePointAroundPivot(ref srPoint7, boundsCenter, goRot);

        // create scaling handles

        Vector3 objectPosition = this.gameObject.transform.position;
        Vector3 objectScale = this.gameObject.transform.lossyScale;

        CreateEndPoint(srPoint0 + objectPosition);
        CreateEndPoint(srPoint1 + objectPosition);
        CreateEndPoint(srPoint2 + objectPosition);
        CreateEndPoint(srPoint3 + objectPosition);
        CreateEndPoint(srPoint4 + objectPosition);
        CreateEndPoint(srPoint5 + objectPosition);
        CreateEndPoint(srPoint6 + objectPosition);
        CreateEndPoint(srPoint7 + objectPosition);

        // create and apply material
        if (isOwner)
        {
            render.material = srSelectorMaterial;
        }
        else
        {
            render.material = srOtherSelectorMaterial;
        }
        

        // change box tag
        srBoundingBox.tag = "ScaleRotSys";

        /* Create delete button
        GameObject deleteButton = Instantiate(Resources.Load("DeleteButton")) as GameObject;
        deleteButton.transform.parent = gameObject.transform;
        Vector3 height_modifier = new Vector3(0, srBounds.size.y, 0);
        deleteButton.transform.position = objectPosition + height_modifier;
        deleteButton.transform.rotation = Quaternion.FromToRotation(Vector3.up, Camera.main.transform.forward);
        */
    }

    void CreateEndPoint(Vector3 position)
    {
        // get object type and scale from manager
        PrimitiveType pt = ScaleRotManager.usedHandleType;
        float hScale = ScaleRotManager.usedHandleScale;

        // create handle, destroy collider for now
        GameObject handle = GameObject.CreatePrimitive(pt);

        // move to parameter position
        handle.transform.position = position;

        // set parent
        handle.transform.parent = this.transform;

        // destroy collider
        Destroy(handle.GetComponent<Collider>());

        // scale
        handle.transform.localScale = new Vector3(0.15f, 0.15f, 0.15f) * hScale;

        // set tag and material
        handle.tag = "ScaleRotSys";
        Renderer handleRender = handle.GetComponent<Renderer>();
        handleRender.material = srScaleMaterial;
    }

    void RotatePointAroundPivot(ref Vector3 point, Vector3 pivot, Quaternion rotation)
    {
        // get point direction relative to pivot
        Vector3 dir = point - pivot;

        // rotate it
        dir = rotation * dir;

        // calculate rotated point
        point = dir + pivot;
    }

}
