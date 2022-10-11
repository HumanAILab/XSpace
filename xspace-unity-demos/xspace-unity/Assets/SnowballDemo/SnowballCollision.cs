using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SnowballCollision : MonoBehaviour {

    public GameObject smoke;
    public GameObject explosion;

	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		
	}

    void OnCollisionEnter(Collision hit)
    {
        Debug.Log("hit something!");

        GameObject sm = Instantiate(smoke, transform.position, Quaternion.identity) as GameObject;
        sm.transform.localScale = new Vector3(0.05f, 0.05f, 0.05f);

        GameObject exp = Instantiate(explosion, transform.position, Quaternion.identity) as GameObject;
        exp.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);

        Destroy(gameObject); // destroy the grenade

        Destroy(sm, 3); // delete the explosion after 3 seconds
        Destroy(exp, 3);
    }
}
