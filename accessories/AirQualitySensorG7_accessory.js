var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var WebSocketClient = require('websocket').client;

var PORT = 9000
var client = new WebSocketClient();

var AIRQUALITY_SENSOR = {
  pm2_5Density: 30,
  pm10Density: 30,
  aqi: Characteristic.AirQuality.GOOD,
  airParticulateSize: 0, // 0 is pm2.5 1 is pm1.0

  getStatus: function() {
    console.log("Get status")
  },
  identify: function() {
    console.log("Identify the air quality sensor!");
  }
}

var sensorUUID = uuid.generate("hap-nodejs:accessories:airqualitysensorg7");

var sensor = exports.accessory = new Accessory("Air Quality Sensor G7", sensorUUID);

sensor.username = "1A:2B:3C:4D:E1:F2"
sensor.pincode = "031-45-154"

sensor
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Nero")
  .setCharacteristic(Characteristic.Model, "G7-v1")
  .setCharacteristic(Characteristic.SerialNumber, "031242");

sensor.on('identify', function(paired, callback) {
  AIRQUALITY_SENSOR.identify();
  callback();
});

sensor.addService(Service.AirQualitySensor, "Air Quality Sensor")
  .getCharacteristic(Characteristic.AirQuality)
  .on('get', function(callback) {
    // callback(null, AIRQUALITY_SENSOR.aqi);
    console.log("AirQuality get status");
    callback(null, AIRQUALITY_SENSOR.aqi);
  });

sensor
  .getService(Service.AirQualitySensor)
  .addCharacteristic(Characteristic.AirParticulateDensity)
  .on('get', function(callback) {
    console.log("AirQuality Density get status");
    if(AIRQUALITY_SENSOR.airParticulateSize === 0) {
        callback(null, AIRQUALITY_SENSOR.pm2_5Density);
    }else{
        callback(null, AIRQUALITY_SENSOR.pm10Density);
    }
  });

sensor
  .getService(Service.AirQualitySensor)
  .addCharacteristic(Characteristic.AirParticulateSize)
  .on('get', function(callback) {
    console.log("AirQuality Size get status");
    callback(null, AIRQUALITY_SENSOR.airParticulateSize);
  });

function setAirQuality(density) {
    var quality = 0;
    if (density <= 50) {
        quality = Characteristic.AirQuality.EXCELLENT;
    }else if (density <= 100) {
        quality = Characteristic.AirQuality.GOOD;
    }else if (density <= 200) {
        quality = Characteristic.AirQuality.FAIR;
    }else if (density <= 300) {
        quality = Characteristic.AirQuality.INFERIOR;
    }else {
        quality = Characteristic.AirQuality.POOR;
    }
    AIRQUALITY_SENSOR.aqi = quality;
    sensor.getService(Service.AirQualitySensor)
        .setCharacteristic(Characteristic.AirQuality, quality);
}


function setSensor(airQualty) {
    AIRQUALITY_SENSOR.pm10Density = airQualty.pm10_cf;
    AIRQUALITY_SENSOR.pm2_5Density = airQualty.pm2_5_cf;
    if(AIRQUALITY_SENSOR.airParticulateSize === 0) { // pm2.5
        sensor.getService(Service.AirQualitySensor)
            .setCharacteristic(Characteristic.AirParticulateSize, AIRQUALITY_SENSOR.airParticulateSize);
        sensor.getService(Service.AirQualitySensor)
            .setCharacteristic(Characteristic.AirParticulateDensity, AIRQUALITY_SENSOR.pm2_5Density);
        setAirQuality(AIRQUALITY_SENSOR.pm2_5Density);
    }else {
        sensor.getService(Service.AirQualitySensor)
            .setCharacteristic(Characteristic.AirParticulateSize, AIRQUALITY_SENSOR.airParticulateSize);
        sensor.getService(Service.AirQualitySensor)
            .setCharacteristic(Characteristic.AirParticulateDensity, AIRQUALITY_SENSOR.pm10Density);   
        setAirQuality(AIRQUALITY_SENSOR.pm10Density);
    }
    AIRQUALITY_SENSOR.airParticulateSize = (AIRQUALITY_SENSOR.airParticulateSize + 1)%2;
}

client.on('connectFailed', function(error) {
    console.log('Connect  Error: AirQuality' + error.toString());
    setTimeout(function () {
        client.connect('ws://localhost:' + PORT + '/');
    }, 3000);
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected AirQuality');
    connection.on('error', function(error) {

        console.log("Connection Error: AirQuality" + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection AirQuality Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
            var jsonData = JSON.parse(message.utf8Data);
            console.log(jsonData)
            if (jsonData.result === 'success') {
                var airQualty = jsonData.data;
                setSensor(airQualty);
            }
        }
    });

    function sendData() {
        if (connection.connected) {
            var obj = {target: "AirQualitySensor", service: "status"};
            var json = JSON.stringify(obj);
            connection.sendUTF(json);
            // setTimeout(sendData, 3000);
        }
    }
    sendData();
});


client.connect('ws://localhost:' + PORT + '/');