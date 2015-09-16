**js-aruco** is a port to JavaScript of the ArUco library.

[ArUco](http://www.uco.es/investiga/grupos/ava/node/26) is a minimal library for Augmented Reality applications based on OpenCv.

### Demos ###

100% JavaScript (see details bellow):

- [Webcam live demo!](https://jcmellado.github.io/js-aruco/getusermedia/getusermedia.html)

3D Pose Estimation:

- [3D Earth!](https://jcmellado.github.io/js-aruco/debug-posit/debug-posit.html)

Visual Debugging:

- [Debug session jam!](https://jcmellado.github.io/js-aruco/debug/debug.html)

Flash camera access (see details bellow):

- [Webcam live demo!](https://jcmellado.github.io/js-aruco/webcam/webcam.html)

### Videos ###

Webcam video adquisition:

[![js-aruco](http://img.youtube.com/vi/_wzPupbww4I/0.jpg)](http://www.youtube.com/watch?v=_wzPupbww4I)

3D Pose estimation:

[![js-aruco](http://img.youtube.com/vi/9WD4wR3_-JM/0.jpg)](http://www.youtube.com/watch?v=9WD4wR3_-JM)

Visual Debugging:

[![js-aruco](http://img.youtube.com/vi/xvTMRdgySUQ/0.jpg)](http://www.youtube.com/watch?v=xvTMRdgySUQ)

### Markers ###

A 7x7 grid with an external unused black border. Internal 5x5 cells contains id information.

Each row must follow any of the following patterns:

`white - black - black - black - black`

`white - black - white - white - white`

`black - white - black - black - white`

`black - white - white - white - black`

Example:

![Marker](http://www.inmensia.com/files/pictures/external/1001.png)

### Usage ###
Create an `AR.Detector` object:

```
var detector = new AR.Detector();
```

Call `detect` function:

```
var markers = detector.detect(imageData);
```

`markers` result will be an array of `AR.Marker` objects with detected markers.

`AR.Marker` objects have two properties:

 * `id`: Marker id.
 * `corners`: 2D marker corners.

`imageData` argument must be a valid `ImageData` canvas object.

```
var canvas = document.getElementById("canvas");
    
var context = canvas.getContext("2d");

var imageData = context.getImageData(0, 0, width, height);
```

### 3D Pose Estimation ###
Create an `POS.Posit` object:

```
var posit = new POS.Posit(modelSize, canvas.width);
```

`modelSize` argument must be the real marker size (millimeters).

Call `pose` function:

```
var pose = posit.pose(corners);
```

`corners` must be centered on canvas:

```
var corners = marker.corners;

for (var i = 0; i < corners.length; ++ i){
  var corner = corners[i];

  corner.x = corner.x - (canvas.width / 2);
  corner.y = (canvas.height / 2) - corner.y;
}
```

`pose` result will be a `POS.Pose` object with two estimated pose (if any):

 * `bestError`: Error of the best estimated pose.
 * `bestRotation`: 3x3 rotation matrix of the best estimated pose.
 * `bestTranslation`: Translation vector of the best estimated pose.
 * `alternativeError`: Error of the alternative estimated pose.
 * `alternativeRotation`: 3x3 rotation matrix of the alternative estimated pose.
 * `alternativeTranslation`: Translation vector of the alternative estimated pose.

Note: POS namespace can be taken from posit1.js or posit2.js.

### WebCam Access ###

To test 100% JavaScript demos use a modern browser like Chrome or Firefox.

### Flash Demo (deprecated) ###

It uses [Flashcam](https://github.com/jcmellado/flashcam), a minimal Flash library to capture video.