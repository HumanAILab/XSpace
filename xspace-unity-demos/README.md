# xspace-unity

## Required Software:

Unity Version: 2017.4.16f1 (LTS)

Visual Studio 2017: With Universal Windows Platform development workload. Don't install the Unity editor with this installation because we need a specific version.

Mixed Reality ToolKit Version: 2017.4.3.0. Windows SDK 10.0.17134 is required for 2017.2+, see https://github.com/Microsoft/MixedRealityToolkit-Unity/releases/tag/2017.4.3.0 for more details. We use the toolkit and the toolkit examples packages.

See also https://docs.microsoft.com/en-us/windows/mixed-reality/install-the-tools.

Google Drive folder with other resources:
https://drive.google.com/open?id=0BxT2eJkLmF4lUXJQVU94eDNUQ2c

## Setup Instructions:
1. Clone this repo, and open the folder ar_collab in Unity. Open the scene 'wizAR.d'.
2. Under the 'Managers' object, find the object 'Neteorking'. Set the Server URL value.
3. In Unity, go to File > Build Settings.
4. Under platform, select Universal Windows Platform, and click Switch Platform.
5. Then click Player Settings... and verify that the project settings are correct. See the settings section below.
6. On the Build Settings window again. Make sure that the scene 'wizAR.d' is included in the build. If not, you can click Add Open Scenes.
7. Set the Target Device to HoloLens. Build Type should be D3D. Under debugging, check Unity C# Projects.
8. Click Build (not Build and Run). A file explorer window will open. Create a folder 'App' for builds, and select it.
9. When the build is complete, the folder 'App' will open in a new file explorer window. Click on the Visual Studio solution.
10. When VS opens, set the configuration to Release x86. You can then deploy to either HoloLens Emulator, or choose remote device and pair with a HoloLens using IP address.

## Contributing:
Unity comes with a tool for merging unity-specific file types. In your git/config file, you should add these lines:

```
[merge]
	tool = unityyamlmerge
[mergetool "unityyamlmerge"]
	trustExitCode = false
	cmd = 'C:/Program Files/Unity/Editor/Data/Tools/UnityYAMLMerge.exe' merge -p "$BASE" "$REMOTE" "$LOCAL" "$MERGED"
```
The file path might be different in your system, you will see a git error if it is incorrect. Default paths are found here: https://docs.unity3d.com/Manual/SmartMerge.html. Windows users should check the slashes in the path. 

More info on using git with Unity is here: https://robots.thoughtbot.com/how-to-git-with-unity

## Unity Project Settings:

Scripting Backend: .NET 4.6

Active Input Handling: Input Manger

Capabilities: InternetClient, InternetClientServer, PrivateNetworkClientServer, Microphone, SpatialPerception

XR Settings: VirtualRealitySupported, Windows Mixed Reality listed as Virtual Reality SDK.

## Unity Project Structure:

Scene: SpatialUnderstandingJaylinTest

- Directional Light
- HoloLens Camera
- Default Cursor

- Origin: Prefab sphere with collider, mesh renderer. Position (0,0,1). Used as a reference point for all other shared objects in the scene.

- Managers
  - SpatialMapping: HoloToolkit Prefab
  - SpatialUnderstanding: HoloToolkit Prefab, add SendSpatialMeshes.cs
  - InputManager: HoloToolkit Prefab
  - Networking: Holds Communication.cs component. Set server URL here, leave UserHeadKey blank on start, set OriginObject to the Origin in the scene
  
  
- ObjectManagers:
  - ObjectHandler: GameObject with GeometryHandler.cs component with variables set as below
    - Com: Networking (child of Managers)
    - Type: "geometry"
    - Prefabs are self explanatory, use BlueCube, Plane, text, LineObj, Origin.
  - SelectionManager: Holds ScaleRotManager.cs component. Children are the three materials
    - ScaleMaterial
    - SelectorMaterial
    - OtherMaterial

- Scene:
  - AppState: Box Collider, Interpolator, and SimpleTagaling. Also holds SystemState.cs, which points to parent scene, the spatial mapping prefab, and other UI elements.
    - DebugDisplay (TextMesh, Billboard.cs)
    - DebugSubDisplay (TextMesh, Billboard.cs)
    - SceneTitle (TextMesh, Billboard.cs)
    - Logo (SpriteRenderer, Billboard.cs)
  - Also has custom cursor, and UI as children but they are inactive/ not used in this scene.

   
## Prefabs:

Cube and Surface: ScaleRotSys.cs, Dragging.cs, ObjType.cs (set type, leave key blank)
- Dragging.cs is the same as HandDraggable.cs from the toolkit, modified slightly to work with the communication manager. The variables Com and OriginObject are set from GeometryHandler.cs. The bool IsDraggingEnabled is set from ScaleRotSys.cs when a user selects or de-selects an object by tapping.

LineObj: ObjType.cs, Line.cs (the one with 2 GameObject params, leave these blank)
