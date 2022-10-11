using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

public class TestSendObjGroup : MonoBehaviour {

    public Communication com;
    bool startToSend;

	// Use this for initialization
	void Start () {
        startToSend = false;
	}
	
	// Update is called once per frame
	void Update () {
        if (!startToSend && (com.userKey != ""))
        {
            SendObjects();
            startToSend = true;
        }
    }

    public void SendObjects()
    {
        StartCoroutine(SendChildObjects());
    }

    // Sends all child objects of this object to remote server
    // This a a coroutine which will take multiple frames to complete.
    // (Send one object each frame)
    public IEnumerator SendChildObjects()
    {
        foreach (Transform child in this.gameObject.transform)
        {
            SendMesh(child.gameObject);
            yield return null;
        }
    }

    public void SendMesh(GameObject obj)
    {
        Debug.Log("clicked the object!");
        Mesh m = obj.GetComponent<MeshFilter>().mesh;

        StringBuilder sb = new StringBuilder();

        sb.Append("g ").Append("mesh").Append("\\n");
        foreach (Vector3 v in m.vertices)
        {
            sb.Append(string.Format("v {0} {1} {2}\\n", -v.x, v.y, v.z));
        }
        sb.Append("\\n");
        foreach (Vector3 v in m.normals)
        {
            sb.Append(string.Format("vn {0} {1} {2}\\n", v.x, v.y, v.z));
        }
        sb.Append("\\n");
        foreach (Vector3 v in m.uv)
        {
            sb.Append(string.Format("vt {0} {1}\\n", v.x, v.y));
        }
        for (int material = 0; material < m.subMeshCount; material++)
        {
            sb.Append("\\n");

            int[] triangles = m.GetTriangles(material);
            for (int i = 0; i < triangles.Length; i += 3)
            {
                sb.Append(string.Format("f {0}/{0}/{0} {1}/{1}/{1} {2}/{2}/{2}\\n",
                    triangles[i] + 1, triangles[i + 1] + 1, triangles[i + 2] + 1));
            }
        }
        Debug.Log("about to send the object!");
        Debug.Log("String length: " + sb.Length);
        com.SendMesh(sb.ToString(), obj.transform);
    }
}
