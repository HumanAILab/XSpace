using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

[System.Serializable]
public class MeshPart
{
    public string _id;
    public int vis;
    public string type;
    public string objString;
    public double[] position;
    public double[] rotation;
    public double[] scale; 

}

[System.Serializable]
public class MeshParts
{
    //employees is case sensitive and must match the string "employees" in the JSON.
    public MeshPart[] parts;
}




public class readMesh : MonoBehaviour {

    public List<TextAsset> m_meshJSON;
    public List<Material> m_meshMaterials;
    public List<float> m_ceilingCutoffs;
    private int m_maxVertices = 65534;
    private ObjImporter m_objImporter = new ObjImporter();

    void importMeshPart(MeshPart part, Transform parent, Material material, float cutOff, bool removeCeiling = true)
    {
        GameObject meshPartObj = new GameObject("roomPart");
        Mesh roomMesh = m_objImporter.ImportMesh(part.objString);
        // Front 
        GameObject front = new GameObject("front");
        MeshRenderer frontRenderer = front.AddComponent<MeshRenderer>();
        frontRenderer.material = material;
        MeshFilter frontFilter = front.AddComponent<MeshFilter>();
        frontFilter.mesh = Instantiate(roomMesh);
        front.transform.parent = meshPartObj.transform;
        // Back
        GameObject back = new GameObject("back");
        MeshRenderer backRenderer = back.AddComponent<MeshRenderer>();
        backRenderer.material = material;
        MeshFilter backFilter = back.AddComponent<MeshFilter>();
        Mesh backMesh = Instantiate(roomMesh);
        // Invert normals
        for(int i = 0; i < backMesh.normals.Length; i++)
            backMesh.normals[i] = -backMesh.normals[i];
        // Reverse triangle order 
        backMesh.triangles = backMesh.triangles.Reverse().ToArray();
        backFilter.mesh = backMesh;
        back.transform.parent = meshPartObj.transform;

        // Position part
        meshPartObj.transform.SetParent(parent);
        meshPartObj.transform.position = new Vector3(
            (float)part.position[0],
            (float)part.position[1],
            (float)part.position[2]
        );
        meshPartObj.transform.eulerAngles = new Vector3(
            (float)part.rotation[1] * Mathf.Rad2Deg,
            (float)part.rotation[0] * Mathf.Rad2Deg,
            (float)part.rotation[2] * Mathf.Rad2Deg
        );
        meshPartObj.transform.localScale = new Vector3(
            (float)part.scale[0],
            (float)part.scale[1],
            (float)part.scale[2]
        );

        if ((removeCeiling && frontRenderer.bounds.center.y > cutOff) ||
            frontFilter.mesh.vertices.Length <= 0 ||
            backFilter.mesh.vertices.Length <= 0)
        {
            meshPartObj.transform.SetParent(null);
            Destroy(meshPartObj);
        }
    }

    // Importing a merged mesh 
    private GameObject importMesh(TextAsset JSON, Material material, float cutOff)
    {
        // Parsed JSON 
        MeshParts meshParts = JsonUtility.FromJson<MeshParts>(JSON.text);

        // Return Object
        GameObject returnObject = new GameObject();

        // Import parts separately
        for (int i = 0; i < meshParts.parts.Length; i++) importMeshPart(meshParts.parts[i], returnObject.transform, material, cutOff);

        return returnObject;

        // Import and merge
        /*
        GameObject mergedPart;
        Vector3[] mergedVertices = new Vector3[0];
        Vector3[] mergedNormals = new Vector3[0];
        int[] mergedTriangles = new int[0];
        MeshRenderer renderer;
        MeshFilter filter;
        Mesh meshPartMesh = new Mesh();
        // Loop through parsed JSON variable (for importing meshes) 
        int numMeshParts = meshParts.parts.Length;
        for (int i = 0; i < numMeshParts; i++)
        {
            // Build transformation matrix 
            Vector3 translation = new Vector3(
                (float)meshParts.parts[i].position[0],
                (float)meshParts.parts[i].position[1],
                (float)meshParts.parts[i].position[2]);
            Quaternion rotation = Quaternion.Euler(
                (float)meshParts.parts[i].rotation[1] * Mathf.Rad2Deg,
                (float)meshParts.parts[i].rotation[0] * Mathf.Rad2Deg,
                (float)meshParts.parts[i].rotation[2] * Mathf.Rad2Deg);
            Vector3 scale = new Vector3(
                (float)meshParts.parts[i].scale[0],
                (float)meshParts.parts[i].scale[1],
                (float)meshParts.parts[i].scale[2]);
            Matrix4x4 transformation = Matrix4x4.TRS(translation, rotation, scale);

            // Import mesh part 
            meshPartMesh = m_objImporter.ImportMesh(meshParts.parts[i].objString);

            // Merge
            int numPartVertices = meshPartMesh.vertices.Length;
            if (numPartVertices <= 0) continue;
            int numPartNormals = meshPartMesh.normals.Length;
            int numPartTriangles = meshPartMesh.triangles.Length;
            int numMergedVertices = mergedVertices.Length;
            if (numMergedVertices + numPartVertices > m_maxVertices)
            {
                mergedPart = new GameObject();
                mergedPart.name = "roomPart";
                renderer = mergedPart.AddComponent<MeshRenderer>();
                renderer.material = m_meshMaterial;
                filter = mergedPart.AddComponent<MeshFilter>();
                filter.mesh = new Mesh();
                filter.mesh.vertices = mergedVertices;
                filter.mesh.normals = mergedNormals;
                filter.mesh.triangles = mergedTriangles;
                mergedPart.transform.SetParent(this.transform);

                mergedVertices = new Vector3[0];
                mergedNormals = new Vector3[0];
                mergedTriangles = new int[0];
                numMergedVertices = 0;
            }
            int numMergedNormals = mergedNormals.Length;
            int numMergedTriangles = mergedTriangles.Length;
            Vector3[] updatedVertices = new Vector3[numMergedVertices + numPartVertices];
            Vector3[] updatedNormals = new Vector3[numMergedNormals + numPartNormals];
            int[] updatedTriangles = new int[numMergedTriangles + numPartTriangles];
            for (int j = 0; j < numMergedVertices; j++)
            {
                updatedVertices[j] = mergedVertices[j];
            }
            for (int j = 0; j < numMergedNormals; j++)
            {
                updatedNormals[j] = mergedNormals[j];
            }
            for (int j = 0; j < numMergedTriangles; j++)
            {
                updatedTriangles[j] = mergedTriangles[j];
            }
            for (int j = 0; j < numPartVertices; j++)
            {
                updatedVertices[numMergedVertices + j] = transformation.MultiplyPoint(meshPartMesh.vertices[j]);
            }
            for (int j = 0; j < numPartNormals; j++)
            {
                updatedNormals[numMergedNormals + j] = transformation.MultiplyVector(meshPartMesh.normals[j]);
            }
            for (int j = 0; j < numPartTriangles; j++)
            {
                updatedTriangles[numMergedTriangles + j] = meshPartMesh.triangles[j] + numMergedVertices;
            }

            mergedVertices = updatedVertices;
            mergedNormals = updatedNormals;
            mergedTriangles = updatedTriangles;
        }
        mergedPart = new GameObject();
        mergedPart.name = "roomPart";
        renderer = mergedPart.AddComponent<MeshRenderer>();
        renderer.material = m_meshMaterial;
        filter = mergedPart.AddComponent<MeshFilter>();
        filter.mesh = new Mesh();
        filter.mesh.vertices = mergedVertices;
        filter.mesh.normals = mergedNormals;
        filter.mesh.triangles = mergedTriangles;
        mergedPart.transform.SetParent(this.transform);
        */
    }

    // Use this for initialization
    void Start()
    {
        // Import mesh
        GameObject roomA = this.importMesh(m_meshJSON[0], m_meshMaterials[0], m_ceilingCutoffs[0]);
        roomA.name = "roomA";

        DateTime start = DateTime.Now;
        Plane slicePlane = new Plane(new Vector3(-1.0f, 0.0f, 1.0f), new Vector3(0.0f, 0.0f, 0.0f));
        Slicer.slice(roomA, slicePlane);
        Debug.Log((DateTime.Now - start).Milliseconds);
    }
	
	// Update is called once per frame
	void Update () {
		
	}
}
