using HoloToolkit.Unity.SpatialMapping;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;

public class RoomExport : MonoBehaviour {

	// Use this for initialization
	void Start () {

        List<MeshFilter> meshes = SpatialMappingManager.Instance.GetMeshFilters();

        // StringBuilder sb = new StringBuilder();

        // Serialize and write the meshes to the file.
        // byte[] data = SimpleMeshSerializer.Serialize(meshes);
        // string converted = Encoding.UTF8.GetString(data, 0, data.Length);

        MeshSaver.Save("testroom", meshes);

        string all_mesh = "";

        for (int i = 0; i < meshes.Count; i++)
        {
            all_mesh += ObjExporter.MeshToString(meshes[i]);
            all_mesh += "\n";
        }




    }
	
	// Update is called once per frame
	void Update () {
		
	}
}
