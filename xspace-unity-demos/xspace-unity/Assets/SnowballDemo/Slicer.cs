using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Slicer : MonoBehaviour
{
    public static void slice(GameObject sliceObject, Plane plane)
    {
        GameObject sliced = Instantiate(sliceObject); 
        sliced.name = sliceObject.name + "Part";

        MeshFilter[] meshFilters = sliced.GetComponentsInChildren<MeshFilter>();
        
        // Iterate through mesh filters
        for (int i = 0; i < meshFilters.Length; i++)
        {
            // Get mesh from mesh filter
            Mesh mesh = meshFilters[i].mesh;
            Matrix4x4 transformation = meshFilters[i].transform.localToWorldMatrix;
            Matrix4x4 invTransform = meshFilters[i].transform.worldToLocalMatrix;
            Vector3[] vertices = mesh.vertices;
            Vector3[] normals = mesh.normals;
            int[] triangles = mesh.triangles;
            List<Vector3> newVertices = new List<Vector3>();
            List<Vector3> newNormals = new List<Vector3>();
            List<int> newTriangles = new List<int>();
            Dictionary<int, int> mapping = new Dictionary<int, int>();
            for (int j = 0; j < vertices.Length; j++)
            {
                float dist = plane.GetDistanceToPoint(transformation.MultiplyPoint(vertices[j]));
                if (dist >= 0)
                {
                    newVertices.Add(vertices[j]);
                    newNormals.Add(normals[j]);
                } 
            } 
            for (int j = 0; j < vertices.Length; j++)
            {
                mapping.Add(j, newVertices.IndexOf(vertices[j]));
            }
            for (int j = 0; j < triangles.Length; j += 3)
            {
                int v0, v1, v2;
                mapping.TryGetValue(triangles[j], out v0);
                mapping.TryGetValue(triangles[j+1], out v1);
                mapping.TryGetValue(triangles[j+2], out v2);
                if (v0 >= 0 && v1 >= 0 && v2 >= 0) // All vertices in front 
                {
                    newTriangles.Add(v0);
                    newTriangles.Add(v1);
                    newTriangles.Add(v2);
                } else if (v0 < 0 && v1 < 0 && v2 < 0) // All vertices behind
                {
                    continue;
                } else // Some in front, some behind
                {
                    int pointsFront = (int)(Mathf.Sign(v0) + Mathf.Sign(v1) + Mathf.Sign(v2));
                    // One in front, two behind
                    if (pointsFront == -1)
                    {
                        int frontIdx, back0Idx, back1Idx;
                        if (v0 >= 0)
                        {
                            frontIdx = triangles[j];
                            back0Idx = triangles[j + 1];
                            back1Idx = triangles[j + 2];
                        }
                        else if (v1 >= 0)
                        {
                            frontIdx = triangles[j + 1];
                            back0Idx = triangles[j + 2];
                            back1Idx = triangles[j];
                        }
                        else
                        {
                            frontIdx = triangles[j + 2];
                            back0Idx = triangles[j];
                            back1Idx = triangles[j + 1];
                        }
                        Vector3 frontLocal = vertices[frontIdx];
                        Vector3 frontGlobal = transformation.MultiplyPoint(frontLocal);
                        Vector3 back0Local = vertices[back0Idx];
                        Vector3 back0Global = transformation.MultiplyPoint(back0Local);
                        Vector3 back1Local = vertices[back1Idx];
                        Vector3 back1Global = transformation.MultiplyPoint(back1Local);
                        float frontBack0Enter, frontBack1Enter;
                        Vector3 frontBack0Dir = (back0Global - frontGlobal).normalized;
                        Vector3 frontBack1Dir = (back1Global - frontGlobal).normalized;
                        plane.Raycast(new Ray(frontGlobal, frontBack0Dir), out frontBack0Enter);
                        plane.Raycast(new Ray(frontGlobal, frontBack1Dir), out frontBack1Enter);
                        Vector3 frontBack0Intersection = invTransform.MultiplyPoint(frontGlobal + (frontBack0Enter * frontBack0Dir));
                        Vector3 frontBack1Intersection = invTransform.MultiplyPoint(frontGlobal + (frontBack1Enter * frontBack1Dir));
                        int frontBack0IntersectionIdx = newVertices.IndexOf(frontBack0Intersection);
                        if (frontBack0IntersectionIdx < 0)
                        {
                            newVertices.Add(frontBack0Intersection);
                            newNormals.Add(0.5f * (normals[frontIdx] + normals[back0Idx]));
                            frontBack0IntersectionIdx = newVertices.IndexOf(frontBack0Intersection);
                        }
                        int frontBack1IntersectionIdx = newVertices.IndexOf(frontBack1Intersection);
                        if (frontBack1IntersectionIdx < 0)
                        {
                            newVertices.Add(frontBack1Intersection);
                            newNormals.Add(0.5f * (normals[frontIdx] + normals[back1Idx]));
                            frontBack1IntersectionIdx = newVertices.IndexOf(frontBack1Intersection);
                        }
                        mapping.TryGetValue(frontIdx, out frontIdx);
                        newTriangles.Add(frontIdx);
                        newTriangles.Add(frontBack0IntersectionIdx);
                        newTriangles.Add(frontBack1IntersectionIdx);
                    }
                    else if (pointsFront == 1) // Two in front, one behind
                    {
                        int backIdx, front0Idx, front1Idx;
                        if (v0 < 0)
                        {
                            backIdx = triangles[j];
                            front0Idx = triangles[j + 1];
                            front1Idx = triangles[j + 2];
                        }
                        else if (v1 < 0)
                        {
                            backIdx = triangles[j + 1];
                            front0Idx = triangles[j + 2];
                            front1Idx = triangles[j];
                        }
                        else
                        {
                            backIdx = triangles[j + 2];
                            front0Idx = triangles[j];
                            front1Idx = triangles[j + 1];
                        }
                        Vector3 backLocal = vertices[backIdx];
                        Vector3 backGlobal = transformation.MultiplyPoint(backLocal);
                        Vector3 front0Local = vertices[front0Idx];
                        Vector3 front0Global = transformation.MultiplyPoint(front0Local);
                        Vector3 front1Local = vertices[front1Idx];
                        Vector3 front1Global = transformation.MultiplyPoint(front1Local);
                        float backFront0Enter, backFront1Enter;
                        Vector3 backFront0Dir = (front0Global - backGlobal).normalized;
                        Vector3 backFront1Dir = (front1Global - backGlobal).normalized;
                        plane.Raycast(new Ray(backGlobal, backFront0Dir), out backFront0Enter);
                        plane.Raycast(new Ray(backGlobal, backFront1Dir), out backFront1Enter);
                        Vector3 backFront0Intersection = invTransform.MultiplyPoint(backGlobal + (backFront0Enter * backFront0Dir));
                        Vector3 backFront1Intersection = invTransform.MultiplyPoint(backGlobal + (backFront1Enter * backFront1Dir));
                        int backFront0IntersectionIdx = newVertices.IndexOf(backFront0Intersection);
                        if (backFront0IntersectionIdx < 0)
                        {
                            newVertices.Add(backFront0Intersection);
                            newNormals.Add(0.5f * (normals[backIdx] + normals[front0Idx]));
                            backFront0IntersectionIdx = newVertices.IndexOf(backFront0Intersection);
                        }
                        int backFront1IntersectionIdx = newVertices.IndexOf(backFront1Intersection);
                        if (backFront1IntersectionIdx < 0)
                        {
                            newVertices.Add(backFront1Intersection);
                            newNormals.Add(0.5f * (normals[backIdx] + normals[front1Idx]));
                            backFront1IntersectionIdx = newVertices.IndexOf(backFront1Intersection);
                        }
                        mapping.TryGetValue(front0Idx, out front0Idx);
                        mapping.TryGetValue(front1Idx, out front1Idx);

                        newTriangles.Add(front0Idx);
                        newTriangles.Add(front1Idx);
                        newTriangles.Add(backFront1IntersectionIdx);
                        newTriangles.Add(front0Idx);
                        newTriangles.Add(backFront1IntersectionIdx);
                        newTriangles.Add(backFront0IntersectionIdx);
                    }
                }
            }

            if (newVertices.ToArray().Length <= 0)
            {
                meshFilters[i].gameObject.SetActive(false);
            } 
            else if (newVertices.ToArray().Length == vertices.Length)
            {
                continue;
            }
            else
            {
                Mesh newMesh = new Mesh();
                newMesh.vertices = newVertices.ToArray();
                newMesh.normals = newNormals.ToArray();
                newMesh.triangles = newTriangles.ToArray();
                meshFilters[i].mesh = newMesh;
            }
        }
    }
}