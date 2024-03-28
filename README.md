**js-aruco** is a port to JavaScript of the ArUco library.

[ArUco](http://www.uco.es/investiga/grupos/ava/node/26) is a minimal library for Augmented Reality applications based on OpenCv.

### Demos ###

100% JavaScript (see details bellow):

- [Webcam live demo!](https://jcmellado.github.io/showcase/js/js-aruco/getusermedia/index.html)

3D Pose Estimation:

- [3D Earth!](https://jcmellado.github.io/showcase/js/js-aruco/debug-posit/index.html)

Visual Debugging:

- [Debug session jam!](https://jcmellado.github.io/showcase/js/js-aruco/debug/index.html)

### Videos ###

[Webcam video adquisition](https://jcmellado.github.io/showcase/videos/js-aruco_%20Augmented%20Reality%20on%20JavaScript.mp4)

[3D Pose estimation](https://jcmellado.github.io/showcase/videos/js-aruco_%20Coplanar%20POSIT.mp4)

[Visual Debugging](https://jcmellado.github.io/showcase/videos/js-aruco_%20Debugging%20Augmented%20Reality%20with%20JavaScript.mp4)

### Markers ###

A 7x7 grid with an external unused black border. Internal 5x5 cells contains id information.

Each row must follow any of the following patterns:

`white - black - black - black - black`

`white - black - white - white - white`

`black - white - black - black - white`

`black - white - white - white - black`

Example:

![Marker](https://jcmellado.github.io/showcase/img/marker-1001.png)

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

### Flash Demo (deprecated) ###

It uses [Flashcam](https://github.com/jcmellado/flashcam), a minimal Flash library to capture video.
