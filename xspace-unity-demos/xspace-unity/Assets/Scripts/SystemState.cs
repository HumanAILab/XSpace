using HoloToolkit.Unity;
using HoloToolkit.Unity.InputModule;
using HoloToolkit.Unity.SpatialMapping;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Moulin.DDP;

#if UNITY_WSA || UNITY_STANDALONE_WIN
using UnityEngine.Windows.Speech;
#endif

public enum SysState {
    Connecting,
    Connected,
    Scanning,
    FinishingScan,
    SendingScan,
    Waiting,
    Ready,
    Done
};

namespace HoloToolkit.Examples.SpatialUnderstandingFeatureOverview
{

    public class SystemState : Singleton<SystemState>, ISourceStateHandler, IInputClickHandler
    {
        // Consts
        // public float kMinAreaForStats = 5.0f;
        // public float kMinAreaForComplete = 50.0f;
        // public float kMinHorizAreaForComplete = 25.0f;
        // public float kMinWallAreaForComplete = 10.0f;

        [Header("Consts")]
        public float kMinAreaForStats = 0.5f;
        public float kMinAreaForComplete = 1.0f;
        public float kMinHorizAreaForComplete = 0.5f;
        public float kMinWallAreaForComplete = 0.5f;

        // Mapping configuration
        [Header("Mapping Configuration")]
        public Transform Parent_Scene;
        public SpatialMappingObserver MappingObserver;
        public SpatialMappingManager MappingManager;
        bool needToStartScan = false;

        // Display, UI
        [Header("Display, UI")]
        public TextMesh DebugDisplay;
        public TextMesh DebugSubDisplay;
        public TextMesh SceneTitleDisplay;
        public GameObject LogoSprite;
        public SpatialUnderstandingCursor AppCursor;

        // State data, local and remote
        [Header("State data")]
        public bool remoteScanning;
        public bool remoteDone;
        public string headKey = "";
        public string entryId;

        // Networking
        [Header("Networking")]
        public Communication com;
        public SendSpatialMeshes MeshCom;

        /// <summary>
        /// Event indicating that the scan state has changed
        /// </summary>
        public event Action SysStateChanged;

        // Properties

        public SysState SysState
        {
            get
            {
                return sysState;
            }
            set
            {
                Debug.Log("Changed sys state to " + value);
                sysState = value;

                // Update Text, etc.
                switch (sysState)
                {
                    case SysState.Connecting:
                        primaryText += "Connecting to remote server...\n";
                        break;
                    case SysState.Connected:
                        primaryText += "Finalizing connection and getting scan state...\n";
                        if (!remoteScanning && !remoteDone)
                        {
                            Debug.Log("Wrong sys state!");
                            Debug.Log("ID is " + entryId);
                            com.ClaimScan(entryId);
                        }
                        // Check here if someone else has already started the scan:
                        if (remoteScanning && headKey != com.userKey)
                        {
                            SysState = SysState.Waiting;
                        }
                        else if (remoteDone)
                        {
                            SysState = SysState.Ready;
                        }
                        break;
                    case SysState.Scanning:
                        needToStartScan = true;
                        primaryText += "Walk around and scan in your playspace.\n";
                        primaryText += "When ready, air tap to finalize your playspace.\n";
                        break;
                    case SysState.FinishingScan:
                        primaryText += "Finalizing scan (please wait)...\n";
                        break;
                    case SysState.SendingScan:
                        primaryText += "Sending scan data to server...\n";
                        break;
                    case SysState.Waiting:
                        primaryText += "Waiting for another user to complete scan...\n";
                        break;
                    case SysState.Ready:
                        primaryText += "Scanning completed!\n";
                        break;
                }

                SysStateChanged?.Invoke(); // If valid, call
            }
        }

        public string SpaceQueryDescription
        {
            get
            {
                return spaceQueryDescription;
            }
            set
            {
                spaceQueryDescription = value;
                objectPlacementDescription = "";
            }
        }

        public string ObjectPlacementDescription
        {
            get
            {
                return objectPlacementDescription;
            }
            set
            {
                objectPlacementDescription = value;
                spaceQueryDescription = "";
            }
        }

        public bool DoesScanMeetMinBarForCompletion
        {
            get
            {
                // Only allow this when we are actually scanning
                if ((SpatialUnderstanding.Instance.ScanState != SpatialUnderstanding.ScanStates.Scanning) ||
                    (!SpatialUnderstanding.Instance.AllowSpatialUnderstanding))
                {
                    return false;
                }

                // Query the current playspace stats
                IntPtr statsPtr = SpatialUnderstanding.Instance.UnderstandingDLL.GetStaticPlayspaceStatsPtr();
                if (SpatialUnderstandingDll.Imports.QueryPlayspaceStats(statsPtr) == 0)
                {
                    return false;
                }
                SpatialUnderstandingDll.Imports.PlayspaceStats stats = SpatialUnderstanding.Instance.UnderstandingDLL.GetStaticPlayspaceStats();

                // Check our preset requirements
                if ((stats.TotalSurfaceArea > kMinAreaForComplete) ||
                    (stats.HorizSurfaceArea > kMinHorizAreaForComplete) ||
                    (stats.WallSurfaceArea > kMinWallAreaForComplete))
                {
                    return true;
                }
                return false;
            }
        }

        public string PrimaryText
        {
            get
            {
                // Display the space and object query results (has priority)
                if (!string.IsNullOrEmpty(SpaceQueryDescription))
                {
                    return SpaceQueryDescription;
                }
                else if (!string.IsNullOrEmpty(ObjectPlacementDescription))
                {
                    return ObjectPlacementDescription;
                }

                // System State
                return primaryText;
            }
        }

        public Color PrimaryColor
        {
            get
            {
                if (SpatialUnderstanding.Instance.ScanState == SpatialUnderstanding.ScanStates.Scanning)
                {
                    if (trackedHandsCount > 0)
                    {
                        return DoesScanMeetMinBarForCompletion ? Color.green : Color.red;
                    }
                    return DoesScanMeetMinBarForCompletion ? Color.yellow : Color.white;
                }

                // If we're looking at the menu, fade it out
                Vector3 hitPos, hitNormal;
                UnityEngine.UI.Button hitButton;
                float alpha = AppCursor.RayCastUI(out hitPos, out hitNormal, out hitButton) ? 0.15f : 1.0f;

                // Special case processing & 
                return (!string.IsNullOrEmpty(SpaceQueryDescription) || !string.IsNullOrEmpty(ObjectPlacementDescription)) ?
                    (PrimaryText.Contains("processing") ? new Color(1.0f, 0.0f, 0.0f, 1.0f) : new Color(1.0f, 0.7f, 0.1f, alpha)) :
                    new Color(1.0f, 1.0f, 1.0f, alpha);
            }
        }

        public string DetailsText
        {
            get
            {
                if (SpatialUnderstanding.Instance.ScanState == SpatialUnderstanding.ScanStates.None)
                {
                    return "";
                }

                // Scanning stats get second priority
                if ((SpatialUnderstanding.Instance.ScanState == SpatialUnderstanding.ScanStates.Scanning) &&
                    (SpatialUnderstanding.Instance.AllowSpatialUnderstanding))
                {
                    IntPtr statsPtr = SpatialUnderstanding.Instance.UnderstandingDLL.GetStaticPlayspaceStatsPtr();
                    if (SpatialUnderstandingDll.Imports.QueryPlayspaceStats(statsPtr) == 0)
                    {
                        return "Playspace stats query failed";
                    }
                    SpatialUnderstandingDll.Imports.PlayspaceStats stats = SpatialUnderstanding.Instance.UnderstandingDLL.GetStaticPlayspaceStats();

                    // Start showing the stats when they are no longer zero
                    if (stats.TotalSurfaceArea > kMinAreaForStats)
                    {
                        string subDisplayText = string.Format("totalArea={0:0.0}, horiz={1:0.0}, wall={2:0.0}", stats.TotalSurfaceArea, stats.HorizSurfaceArea, stats.WallSurfaceArea);
                        subDisplayText += string.Format("\nnumFloorCells={0}, numCeilingCells={1}, numPlatformCells={2}", stats.NumFloor, stats.NumCeiling, stats.NumPlatform);
                        subDisplayText += string.Format("\npaintMode={0}, seenCells={1}, notSeen={2}", stats.CellCount_IsPaintMode, stats.CellCount_IsSeenQualtiy_Seen + stats.CellCount_IsSeenQualtiy_Good, stats.CellCount_IsSeenQualtiy_None);
                        return subDisplayText;
                    }
                    return "";
                }
                return "";
            }
        }

        // Privates
        private SysState sysState;
        private JsonObjectCollection systemStateCollection;
        private string spaceQueryDescription;
        private string objectPlacementDescription;
        private string primaryText = "";
        private uint trackedHandsCount = 0;

        // Functions
        private void Start()
        {
            // Default the scene & the HoloToolkit objects to the camera
            Vector3 sceneOrigin = CameraCache.Main.transform.position;
            Parent_Scene.transform.position = sceneOrigin;
            MappingObserver.SetObserverOrigin(sceneOrigin);
            InputManager.Instance.AddGlobalListener(gameObject);

            // Init state:
            SysState = SysState.Connecting;

            // Events:
            SpatialUnderstanding.Instance.ScanStateChanged += OnScanStateChanged;
            MeshCom.SendingMeshComplete += OnSendMeshComplete;

            // init collection
            systemStateCollection = com.GetCollection("systemState");

            if (systemStateCollection == null)
            {
                com.OnDBStart.AddListener(() =>
                {
                    systemStateCollection = com.GetCollection("systemState");
                    SetupStateCollection();
                });
            }
            else
            {
                SetupStateCollection();
            }
        }

        private void SetupStateCollection()
        {   
            systemStateCollection.OnAdded += (id, fields) =>
            {
                Debug.Log("systemStateCollection.OnAdded");
                Debug.Log(fields);
                if (!fields.HasField("scanning") || !fields.HasField("done") || !fields.HasField("userKey")) return;
                remoteScanning = fields.GetField("scanning").b;
                remoteDone = fields.GetField("done").b;
                headKey = fields.GetField("userKey").str;
                entryId = id;
            };

            systemStateCollection.OnChanged += (id, fields, cleared) =>
            {
                Debug.Log("systemStateCollection.OnChanged");
                Debug.Log(fields);
                if (fields.HasField("scanning") && !fields.HasField("done"))
                {
                    remoteScanning = fields.GetField("scanning").b;
                    headKey = fields.GetField("userKey").str;

                    // If we claimed the scan, start scanning
                    if (remoteScanning && headKey == com.userKey)
                    {
                        SysState = SysState.Scanning;
                    }
                    // If someone else is scanning, wait
                    else if (remoteScanning && headKey != com.userKey)
                    {
                        SysState = SysState.Waiting;
                    }
                }
                else if (fields.HasField("done"))
                {
                    remoteScanning = fields.GetField("scanning").b;
                    remoteDone = fields.GetField("done").b;

                    if (SysState == SysState.Waiting && remoteDone)
                    {
                        SysState = SysState.Ready;
                    }
                }
                

                Debug.Log("systemStateCollection.OnChanged Done");
            };
        }

        /* EVENTS */

        void OnScanStateChanged()
        {
            switch (SpatialUnderstanding.Instance.ScanState)
            {
                case SpatialUnderstanding.ScanStates.Scanning:
                    // SysState = SysState.Scanning; 
                    // State is already Scanning when we start the understanding scan
                    break;
                case SpatialUnderstanding.ScanStates.Finishing:
                    SysState = SysState.FinishingScan;
                    break;
                case SpatialUnderstanding.ScanStates.Done:
                    SysState = SysState.SendingScan;
                    break;
            }
        }

        void OnSendMeshComplete()
        {
            if (headKey == com.userKey)
            {
                com.ScanFinished(entryId);
            }
            SysState = SysState.Ready;
        }

        protected override void OnDestroy()
        {
            // Events:
            if (SpatialUnderstanding.Instance != null)
            {
                SpatialUnderstanding.Instance.ScanStateChanged -= OnScanStateChanged;
            }

            InputManager.Instance.RemoveGlobalListener(gameObject);
        }

        private void Update_DebugDisplay(float deltaTime)
        {
            // Basic checks
            if (DebugDisplay == null)
            {
                return;
            }

            // Update display text
            DebugDisplay.text = PrimaryText;
            DebugDisplay.color = PrimaryColor;
            DebugSubDisplay.text = DetailsText;
        }

        private void Update_KeyboardInput(float deltaTime)
        {
            // Toggle SurfaceMapping & CustomUnderstandingMesh visibility
            if (Input.GetKeyDown(KeyCode.BackQuote) &&
                (!Input.GetKey(KeyCode.LeftShift) && !Input.GetKey(KeyCode.RightShift)))
            {
                ToggleScannedMesh();
            }
            else if (Input.GetKeyDown(KeyCode.BackQuote) &&
                     (Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift)))
            {
                ToggleProcessedMesh();
            }
        }

        private static void ToggleScannedMesh()
        {
            SpatialMappingManager.Instance.DrawVisualMeshes = !SpatialMappingManager.Instance.DrawVisualMeshes;
            Debug.Log("SpatialUnderstanding -> SpatialMappingManager.Instance.DrawVisualMeshes=" + SpatialMappingManager.Instance.DrawVisualMeshes);
        }

        private static void ToggleProcessedMesh()
        {
            SpatialUnderstanding.Instance.UnderstandingCustomMesh.DrawProcessedMesh = !SpatialUnderstanding.Instance.UnderstandingCustomMesh.DrawProcessedMesh;
            Debug.Log("SpatialUnderstanding -> SpatialUnderstanding.Instance.UnderstandingCustomMesh.DrawProcessedMesh=" + SpatialUnderstanding.Instance.UnderstandingCustomMesh.DrawProcessedMesh);
        }

        private void Update()
        {
             // Call things that can only be called from the main thread here:
             // RequestBeginScanning and StartCoroutine

            if (needToStartScan && SysState == SysState.Scanning && (Time.frameCount % 10 == 0))
            {
                SpatialUnderstanding.Instance.RequestBeginScanning();
                needToStartScan = false;
            }
            if (sysState == SysState.Ready) 
            {
                StartCoroutine(RemoveDebugDisplay());
                SysState = SysState.Done;
            }

            Update_DebugDisplay(Time.deltaTime);
            Update_KeyboardInput(Time.deltaTime);
        }

        public void OnSourceDetected(SourceStateEventData eventData)
        {
            // If the source has positional info and there is currently no visible source
            if (eventData.InputSource.SupportsInputInfo(eventData.SourceId, SupportedInputInfo.GripPosition))
            {
                trackedHandsCount++;
            }
        }

        public void OnSourceLost(SourceStateEventData eventData)
        {
            if (eventData.InputSource.SupportsInputInfo(eventData.SourceId, SupportedInputInfo.GripPosition))
            {
                trackedHandsCount--;
            }
        }

        public void OnInputClicked(InputClickedEventData eventData)
        {
            if ((SpatialUnderstanding.Instance.ScanState == SpatialUnderstanding.ScanStates.Scanning) &&
                !SpatialUnderstanding.Instance.ScanStatsReportStillWorking)
            {
                SpatialUnderstanding.Instance.RequestFinishScan();
            }
        }

        public IEnumerator RemoveDebugDisplay()
        {
            Debug.Log("Waiting for 2 seconds");
            yield return new WaitForSeconds(2);
            Debug.Log("Disabling display");
            DebugDisplay.gameObject.GetComponent<MeshRenderer>().enabled = false;
            DebugSubDisplay.gameObject.GetComponent<MeshRenderer>().enabled = false;
            SceneTitleDisplay.gameObject.GetComponent<MeshRenderer>().enabled = false;
            LogoSprite.GetComponent<SpriteRenderer>().enabled = false;
            AppCursor.gameObject.SetActive(false);
            yield break;
        }
    }

}
