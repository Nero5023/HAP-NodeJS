var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var WebSocketClient = require('websocket').client;

var PORT = 9000;
var client = new WebSocketClient();


var LIGHT_SENSOR = {
    currentAmbientLightLevel: 60,

    getStatus: function() {
        // TODO
        return LIGHT_SENSOR.currentAmbientLightLevel;
    },
    identify: function() {
        console.log("Identify the light sensor!")
    },
    randomizeLightLevel: function() {
      LIGHT_SENSOR.currentAmbientLightLevel = Math.random() * 100000;
    }
}

var lightSensorUUID = uuid.generate('hap-nodejs:accessories:lightsensor');

var lightSensor = exports.accessory = new Accessory('Light Sensor Socket', lightSensorUUID);

lightSensor.username = '1A:2B:3D:4D:0E:0B';
lightSensor.pincode = '031-45-154';

lightSensor
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Nero")
  .setCharacteristic(Characteristic.Model, "LM-v1")
  .setCharacteristic(Characteristic.SerialNumber, "079154");

lightSensor.on('identify', function(paired, callback) {
  LIGHT_SENSOR.identify();
  callback(); // success
});

lightSensor.addService(Service.LightSensor, "Light Sensor")
  .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
  .on('get', function(callback) {
    console.log("LightSensor get status");
    callback(null, LIGHT_SENSOR.currentAmbientLightLevel);
  });

// setInterval(function(){
//   // LIGHT_SENSOR.randomizeLightLevel();
//   client.connect(PORT, '127.0.0.1', function() {
//     var obj = {target: "LightSensor", service: "status"};
//     var json = JSON.stringify(obj);
//     console.log('Connected');
//     client.write(json);
//   });

//   client.on('data', function(data) {
//     console.log("Receive:" + data);
//     data = JSON.parse(data);
//     if (data.result == 'success') {
//       LIGHT_SENSOR.currentAmbientLightLevel = data.value;
//     }
//     client.destroy();

//     lightSensor.getService(Service.LightSensor)
//     .setCharacteristic(Characteristic.CurrentAmbientLightLevel, 
//       LIGHT_SENSOR.currentAmbientLightLevel);
//   });
// }, 3000);

client.on('connectFailed', function(error) {
    console.log('Connect Error connectFailed: LightSensor' + error.toString());
    setTimeout(function () {
        client.connect('ws://localhost:' + PORT + '/');
    }, 3000);
});


client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        client.connect('ws://localhost:' + PORT + '/');
        console.log("Connection Error LightSensor: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
            var jsonData = JSON.parse(message.utf8Data);
            console.log(jsonData)
            console.log(jsonData.result === 'success')
            if (jsonData.result === 'success') {
                LIGHT_SENSOR.currentAmbientLightLevel = jsonData.value;
                console.log(LIGHT_SENSOR.currentAmbientLightLevel)
                lightSensor.getService(Service.LightSensor)
                .setCharacteristic(Characteristic.CurrentAmbientLightLevel, 
                  LIGHT_SENSOR.currentAmbientLightLevel);
            }
        }
    });

    function sendData() {
        if (connection.connected) {
            var obj = {target: "LightSensor", service: "status"};
            var json = JSON.stringify(obj);
            connection.sendUTF(json);
            setTimeout(sendData, 3000);
        }
    }
    sendData();
});


client.connect('ws://localhost:' + PORT + '/');








































