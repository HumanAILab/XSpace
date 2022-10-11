# ar_collab Project Structure

### InputManagers:
GameObject containing the InputManager prefab from HoloToolkit and an event system. This is responsible for managing input sources and dispatching relevant events to the appropriate input handlers. More information on the input module here: https://github.com/Microsoft/HoloToolkit-Unity/blob/master/External/HoloToolkit/Input/DocSource/MDFiles/ReadMe.md#input-module-design 

### Hologram Managers:
Manages the creation of new holograms because a separate gesture recognizer must be used for this.

### ScaleRotManagers:
Manages bounding box and selection system. Component is added through simple iteration through objects in the scene based on tags. Also sets the materials, sizes, and other defaults for bounding boxes. Most importantly, this manages the global variable that keeps track of which object is selected and what state if any the selected object is in.

### Cube/ object prefab(s):
Four scripts must be attatched. ScaleRotSys.cs draws the bounding box around the object. HandDraggable.cs, HandRotate.cs, and HandResize.cs must also be attatched to the GameObject in order for it to be modified.
