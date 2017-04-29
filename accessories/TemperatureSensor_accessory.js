var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var WebSocketClient = require('websocket').client;

var PORT = 9000
var client = new WebSocketClient();

// here's a fake temperature sensor device that we'll expose to HomeKit
var TEM_SENSOR = {
  currentTemperature: 50,
  getTemperature: function() { 
    // console.log("Getting the current temperature!");
    return TEM_SENSOR.currentTemperature;
  }
}

var temSensorUUID = uuid.generate('hap-nodejs:accessories:temperature-sensor');

var temSensor = exports.accessory = new Accessory('Temperature Sensor', temSensorUUID);

temSensor.username = "E3:5D:3:3A:9D:E4";
temSensor.pincode = "031-45-154";

temSensor
  .addService(Service.TemperatureSensor, "Temperature Sensor")
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', function(callback) {
    
    // return our current value
    callback(null, TEM_SENSOR.getTemperature());
  });


// function to set humidity and temperature
function setSensor(temHum) {
    TEM_SENSOR.currentTemperature = temHum.temperature;

    temSensor.getService(Service.TemperatureSensor)
        .setCharacteristic(Characteristic.CurrentTemperature, TEM_SENSOR.getTemperature());
}




client.on('connectFailed', function(error) {
    console.log('Connect  Error: TemperatureSensor' + error.toString());
    setTimeout(function () {
        client.connect('ws://localhost:' + PORT + '/');
    }, 3000);
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected TemperatureSensor');

    // websocket error after connected
    connection.on('error', function(error) {
        console.log("Connection Error: TemperatureSensor" + error.toString());
    });

    // websocket close 
    connection.on('close', function() {
        console.log('echo-protocol Connection TemperatureSensor Closed');
    });

    // websocket get message
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Temperature Sensor Received: '" + message.utf8Data + "'");
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
            var obj = {target: "TemSensor", service: "status"};
            var json = JSON.stringify(obj);
            connection.sendUTF(json);
            // setTimeout(sendData, 3000);
        }
    }
    sendData();
});

setTimeout(function() {
    client.connect('ws://localhost:' + PORT + '/');
}, 10000);
