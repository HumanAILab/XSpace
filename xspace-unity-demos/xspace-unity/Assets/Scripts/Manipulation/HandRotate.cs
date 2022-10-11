using HoloToolkit.Unity.InputModule;
using UnityEngine;

public class HandRotate : MonoBehaviour, IManipulationHandler
{
    [Tooltip("Speed of static rotation when tapping game object.")]
    [SerializeField]
    float RotateSpeed = 12f;

    [Tooltip("Speed of interactive rotation via navigation gestures.")]
    [SerializeField]
    float RotationFactor = 25f;

    Quaternion lastRotation;

    [SerializeField]
    public bool rotatingEnabled = false;
    public void SetRotating(bool enabled)
    {
        rotatingEnabled = enabled;
    }

    public void OnManipulationStarted(ManipulationEventData eventData)
    {
        InputManager.Instance.PushModalInputHandler(gameObject);
        lastRotation = transform.rotation;
    }

    public void OnManipulationUpdated(ManipulationEventData eventData)
    {
        if (rotatingEnabled)
        {
            var rotation = new Quaternion(eventData.CumulativeDelta.y * RotationFactor,
                eventData.CumulativeDelta.x * RotationFactor,
                eventData.CumulativeDelta.z * RotationFactor,
                0f);

            Rotate(rotation);

            //sharing & messaging
            //SharingMessages.Instance.SendRotating(Id, eventData.CumulativeDelta);
        }
    }

    public void OnManipulationCompleted(ManipulationEventData eventData)
    {
        InputManager.Instance.PopModalInputHandler();
    }

    public void OnManipulationCanceled(ManipulationEventData eventData)
    {
        InputManager.Instance.PopModalInputHandler();
    }
        
    void Rotate(Quaternion rotation)
    {
        transform.rotation = Quaternion.Euler(
            new Vector3(lastRotation.x + rotation.x,
                 lastRotation.y + rotation.y,
                 lastRotation.z + rotation.z) * RotateSpeed);
    }
}
