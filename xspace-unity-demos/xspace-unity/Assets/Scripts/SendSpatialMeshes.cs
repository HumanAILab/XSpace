using HoloToolkit.Unity;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

public class SendSpatialMeshes : MonoBehaviour {

    public SnowballCom com;
    private bool sending;
    public event Action SendingMeshComplete;

    // Properties
    public bool Sending
    {
        get
        {
            return sending;
        }
        set
        {
            sending = value;
            if (sending == false)
            {
                SendingMeshComplete?.Invoke(); // If valid, call
            }
        }
    }

    // Use this for initialization
    void Start () {

        // init
        Sending = true;

        // Events
        SpatialUnderstanding.Instance.ScanStateChanged += OnScanStateChanged;
    }

    void OnDestroy()
    {
        if (SpatialUnderstanding.Instance != null)
        {
            SpatialUnderstanding.Instance.ScanStateChanged -= OnScanStateChanged;
        }

    }

    private void OnScanStateChanged()
    {
        // If we are leaving the None state, go ahead and register shapes now
        if ((SpatialUnderstanding.Instance.ScanState == SpatialUnderstanding.ScanStates.Done) &&
            SpatialUnderstanding.Instance.AllowSpatialUnderstanding)
        {
            StartCoroutine(SendChildObjects()); 
        }
    }

    // Sends all child objects of this object to remote server
    // This a a coroutine which will take multiple frames to complete.
    // (Send one object each frame)
    public IEnumerator SendChildObjects()
    {
        foreach (Transform child in this.gameObject.transform)
        {
            SendMesh(child.gameObject);
            child.gameObject.SetActive(false);
            // Test wait one second to space out messages more to avoid crash
            yield return new WaitForSeconds(1.2f);
        }
        Debug.Log("Done sending objects");
        Sending = false;
        yield break;
    }

    public void SendMesh(GameObject obj)
    {
        Mesh m = obj.GetComponent<MeshFilter>().mesh;

        StringBuilder sb = new StringBuilder();

        if (m.vertices.Length == 0)
        {
            return;
        }

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

        com.SendMesh(sb.ToString(), obj.transform);
    }
}
