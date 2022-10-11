using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using UnityEngine;
using UnityEngine.Networking;

// will manage post and get to meteor_ver server

public class HttpManager : MonoBehaviour {

    // Use this for initialization
    void Start()
    {
        //StartCoroutine(CreateObject());
    }

    public static IEnumerator CreateObject(GameObject obj)
    {
        WWWForm form = new WWWForm();
        form.AddField("message", "create");
        form.AddField("object_id", obj.GetInstanceID());
        form.AddField("mesh", ObjExporter.MeshToString(obj.GetComponent<MeshFilter>()));
        // add pos, rot, scale, etc.

        UnityWebRequest www = UnityWebRequest.Post("http://localhost:3000/", form);
        yield return www.Send();

        if (www.isNetworkError)
        {
            System.Diagnostics.Debug.WriteLine(www.error);
        }
        else
        {
            System.Diagnostics.Debug.WriteLine("Form upload complete!");
        }
    }

    public static IEnumerator DeleteObject(int obj_id)
    {
        WWWForm form = new WWWForm();
        form.AddField("message", "delete");
        form.AddField("object_id", obj_id);

        UnityWebRequest www = UnityWebRequest.Post("http://localhost:3000/", form);
        yield return www.Send();

        if (www.isNetworkError)
        {
            System.Diagnostics.Debug.WriteLine(www.error);
        }
        else
        {
            System.Diagnostics.Debug.WriteLine("Form upload complete!");
        }
    }

    // Update is called once per frame
    void Update () {
		// we will want to listen for updates from the server periodically 
        // to see if there are new changes there
	}
}
