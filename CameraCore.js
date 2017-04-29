var storage = require('node-persist');
var uuid = require('./').uuid;
var Accessory = require('./').Accessory;
var Camera = require('./').Camera;

console.log("HAP-NodeJS starting...");

// Initialize our storage system
storage.initSync();

// Start by creating our Bridge which will host all loaded Accessories
var cameraAccessory = new Accessory('Camera', uuid.generate("Study Room Camera"));

var cameraSource = new Camera();

cameraAccessory.configureCameraSource(cameraSource);

cameraAccessory.on('identify', function(paired, callback) {
  console.log("Study Room Camera identify");
  callback(); // success
});

// Publish the camera on the local network.
cameraAccessory.publish({
  username: "AC:EF:3E:DD:32:12",
  port: 51062,
  pincode: "031-45-154",
  category: Accessory.Categories.CAMERA
}, true);
