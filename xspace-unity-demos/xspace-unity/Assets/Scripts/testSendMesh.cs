using HoloToolkit.Unity.InputModule;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

public class testSendMesh : MonoBehaviour, IInputClickHandler
{

    public Communication com;

    // Use this for initialization
    void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		
	}

    void IInputClickHandler.OnInputClicked(InputClickedEventData eventData)
    {
        Debug.Log("clicked the object!");
        Mesh m = this.gameObject.GetComponent<MeshFilter>().mesh;

        StringBuilder sb = new StringBuilder();

        sb.Append("g ").Append("mesh").Append("\\n");
        foreach (Vector3 v in m.vertices)
        {
            sb.Append(string.Format("v {0} {1} {2}\\n", v.x, v.y, v.z));
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
        com.SendMesh(sb.ToString(), this.gameObject.transform);
    }

}
