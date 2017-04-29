var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var WebSocketClient = require('websocket').client;

var PORT = 9000
var client = new WebSocketClient();


var HUM_SENSOR = {
  currentHumidity: 50,
  getHumidity: function() { 
    return HUM_SENSOR.currentHumidity;
  }
}


// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
var humSensorUUID = uuid.generate('hap-nodejs:accessories:humidity-sensor');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
var humSensor = exports.accessory = new Accessory('Humidity Sensor', humSensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
humSensor.username = "C1:5D:3A:AE:6D:F2"
humSensor.pincode = "031-45-154";
// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
humSensor
  .addService(Service.HumiditySensor)
  .getCharacteristic(Characteristic.CurrentRelativeHumidity)
  .on('get', function(callback){

    callback(null, HUM_SENSOR.getHumidity());
  });



// function to set humidity and temperature
function setSensor(temHum) {
    HUM_SENSOR.currentHumidity = temHum.humidity;

    humSensor.getService(Service.HumiditySensor)
        .setCharacteristic(Characteristic.CurrentRelativeHumidity, HUM_SENSOR.getHumidity());
}




client.on('connectFailed', function(error) {
    console.log('Connect  Error: HumiditySensor' + error.toString());
    setTimeout(function () {
        client.connect('ws://localhost:' + PORT + '/');
    }, 3000);
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected HumiditySensor');

    // websocket error after connected
    connection.on('error', function(error) {
        console.log("Connection Error: HumiditySensor" + error.toString());
    });

    // websocket close 
    connection.on('close', function() {
        console.log('echo-protocol Connection HumiditySensor Closed');
    });

    // websocket get message
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("HumiditySensor Received: '" + message.utf8Data + "'");
            var jsonData = JSON.parse(message.utf8Data);
            console.log(jsonData)
            if (jsonData.result === 'success') {
                var temHum = jsonData.data;
                setSensor(temHum);
            }
        }
    });

    function sendData() {
        if (connection.connected) {
            var obj = {target: "HumSensor", service: "status"};
            var json = JSON.stringify(obj);
            connection.sendUTF(json);
            // setTimeout(sendData, 3000);
        }
    }
    sendData();
});


client.connect('ws://localhost:' + PORT + '/');
