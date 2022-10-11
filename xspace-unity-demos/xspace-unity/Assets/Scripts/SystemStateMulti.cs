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

public enum SysStateMulti
{
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

    public class SystemStateMulti : Singleton<SystemStateMulti>, ISourceStateHandler, IInputClickHandler
    {
        // Consts
        // public float kMinAreaForStats = 5.0f;
        // public float kMinAreaForComplete = 50.0f;
        // public float kMinHorizAreaForComplete = 25.0f;
        // public float kMinWallAreaForComplete = 10.0f;

        [Header("Space Keys")]
        public string ourSpace = "A";
        public string otherSpace = "B";

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

        // State data, local and remote
        [Header("State data")]
        public bool remoteScanning;
        public bool remoteDone;
        public string headKey = "";
        public string entryId;

        public bool otherScanning;
        public bool otherDone;
        public string otherHeadKey = "";

        // Networking
        [Header("Networking")]
        public SnowballCom com;
        public SendSpatialMeshes MeshCom;

        /// <summary>
        /// Event indicating that the scan state has changed
        /// </summary>
        public event Action SysStateMultiChanged;

        // Properties

        public SysStateMulti SysStateMulti
        {
            get
            {
                return sysStateMulti;
            }
            set
            {
                Debug.Log("Changed sys state to " + value);
                sysStateMulti = value;

                // Update Text, etc.
                switch (sysStateMulti)
                {
                    case SysStateMulti.Connecting:
                        primaryText += "Connecting to remote server...\n";
                        break;
                    case SysStateMulti.Connected:
                        primaryText += "Finalizing connection and getting scan state...\n";
                        if (!remoteScanning && !remoteDone)
                        {
                            Debug.Log("ID is " + entryId);
                            Debug.Log("claiming scan");
                            com.ClaimScan2(entryId);
                        }
                        // Check here if someone else has already started the scan:
                        if (remoteScanning && headKey != com.userKey)
                        {
                            SysStateMulti = SysStateMulti.Waiting;
                        }
                        else if (!otherDone)
                        {
                            SysStateMulti = SysStateMulti.Waiting;
                        }
                        else if (remoteDone) // And other done
                        {
                            SysStateMulti = SysStateMulti.Ready;
                        }
                        break;
                    case SysStateMulti.Scanning:
                        needToStartScan = true;
                        primaryText += "Walk around and scan in your playspace.\n";
                        primaryText += "When ready, air tap to finalize your playspace.\n";
                        break;
                    case SysStateMulti.FinishingScan:
                        primaryText += "Finalizing scan (please wait)...\n";
                        break;
                    case SysStateMulti.SendingScan:
                        primaryText += "Sending scan data to server...\n";
                        break;
                    case SysStateMulti.Waiting:
                        primaryText += "Waiting for another user to complete scan...\n";
                        break;
                    case SysStateMulti.Ready:
                        primaryText += "Scanning completed!\n";
                        break;
                }

                SysStateMultiChanged?.Invoke(); // If valid, call
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
        private SysStateMulti sysStateMulti;
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
            SysStateMulti = SysStateMulti.Connecting;

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
                    Debug.Log(systemStateCollection);
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

                entryId = id;

                if (!fields.HasField(ourSpace + "scanning") || !fields.HasField(ourSpace + "done") || !fields.HasField(ourSpace + "headKey")) return;
                remoteScanning = fields.GetField(ourSpace + "scanning").b;
                remoteDone = fields.GetField(ourSpace + "done").b;
                headKey = fields.GetField(ourSpace + "headKey").str;

                if (!fields.HasField(otherSpace + "scanning") || !fields.HasField(otherSpace + "done") || !fields.HasField(otherSpace + "headKey")) return;
                otherScanning = fields.GetField(otherSpace + "scanning").b;
                otherDone = fields.GetField(otherSpace + "done").b;
                otherHeadKey = fields.GetField(otherSpace + "headKey").str;
            };

            systemStateCollection.OnChanged += (id, fields, cleared) =>
            {
                Debug.Log("systemStateCollection.OnChanged");
                Debug.Log(fields);

                // First update other user state:
                if (fields.HasField(otherSpace + "scanning"))
                {
                    otherScanning = fields.GetField(otherSpace + "scanning").b;
                }
                if (fields.HasField(otherSpace + "done"))
                {
                    otherDone = fields.GetField(otherSpace + "done").b;
                    if (otherDone && remoteDone)
                    {
                        SysStateMulti = SysStateMulti.Ready;
                    }
                }
                if (fields.HasField(otherSpace + "headKey"))
                {
                    otherHeadKey = fields.GetField(otherSpace + "headKey").str;
                }

                // If we are scanning
                if (fields.HasField(ourSpace + "scanning") && !fields.HasField(ourSpace + "done"))
                {
                    remoteScanning = fields.GetField(ourSpace + "scanning").b;
                    headKey = fields.GetField(ourSpace + "headKey").str;

                    // If we claimed the scan, start scanning
                    if (remoteScanning && headKey == com.userKey)
                    {
                        SysStateMulti = SysStateMulti.Scanning;
                    }

                    // If someone else is scanning, wait
                    else if (remoteScanning && headKey != com.userKey)
                    {
                        SysStateMulti = SysStateMulti.Waiting;
                    }
                }

                // If we are done scanning
                else if (fields.HasField(ourSpace + "done"))
                {
                    remoteScanning = fields.GetField(ourSpace + "scanning").b;
                    remoteDone = fields.GetField(ourSpace + "done").b;

                    if (SysStateMulti == SysStateMulti.Waiting && remoteDone && otherDone)
                    {
                        SysStateMulti = SysStateMulti.Ready;
                    }
                    if (SysStateMulti == SysStateMulti.Waiting && remoteDone && !otherDone)
                    {
                        SysStateMulti = SysStateMulti.Ready;
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
                    // SysStateMulti = SysStateMulti.Scanning; 
                    // State is already Scanning when we start the understanding scan
                    break;
                case SpatialUnderstanding.ScanStates.Finishing:
                    SysStateMulti = SysStateMulti.FinishingScan;
                    break;
                case SpatialUnderstanding.ScanStates.Done:
                    SysStateMulti = SysStateMulti.SendingScan;
                    break;
            }
        }

        void OnSendMeshComplete()
        {
            if (headKey == com.userKey)
            {
                com.ScanFinished(entryId);
            }
            if (otherDone)
            {
                SysStateMulti = SysStateMulti.Ready;
            }
            else
            {
                SysStateMulti = SysStateMulti.Waiting;
            }
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

            if (needToStartScan && SysStateMulti == SysStateMulti.Scanning && (Time.frameCount % 10 == 0))
            {
                SpatialUnderstanding.Instance.RequestBeginScanning();
                needToStartScan = false;
            }
            if (sysStateMulti == SysStateMulti.Ready)
            {
                StartCoroutine(RemoveDebugDisplay());
                SysStateMulti = SysStateMulti.Done;
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
            yield break;
        }
    }

}
