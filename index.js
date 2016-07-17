var mqtt = require("mqtt"),
	Hue = require("philips-hue"),
	hue = new Hue(),
	oConfig = require("./config.json"),
	Site = require("./site.js"),

	sHueConfigFilePath, oMqttClient,
	oSites = {},
	oLightGroups = {};

if (!oConfig.brokerUrl || !oConfig.topics) {
	console.log("There's something missing in your config.json, please refer to config.example.json for an example");
	process.exit(1);
}

sHueConfigFilePath = process.env.HOME + "/.philips-hue.json";
hue.devicetype = "hercules";

oMqttClient = mqtt.connect(oConfig.brokerUrl);
console.log("MQTT Broker URL: " + oConfig.brokerUrl);

function start() {
	hue
		.login(sHueConfigFilePath)
		.then(function(conf) {
			console.log(new Date() + " - Connected to bridge: " + conf.bridge);
			loadGroups(function() {
				subscribeMqttTopics();
			});
			// hue.getLights().then(function(res) {console.log(res['5'].state.xy);})
		});
}

function loadGroups(callback) {
	hue.request({path: "/groups"}).then(function(res) {
		var sKey, sName, mMapping,
			oHueGroup;

		mMapping = oConfig.mqttTopicRoomToHueGroupMapping;

		for (sKey in res) {
			if (res.hasOwnProperty(sKey)) {
				oHueGroup = res[sKey];

				sName = mMapping[oHueGroup.name] || oHueGroup.name;
				// Create lightgroup with array of light IDs
				oLightGroups[sName] = {
					aLights: oHueGroup.lights.map(function(sLight) {
						return hue.light(parseInt(sLight, 10));
					})
				};
			}
		}

		callback();
	});
}

function subscribeMqttTopics() {
	var aTopics, i;

	aTopics = oConfig.topics;
	for (i = 0; i < aTopics.length; i++) {
		// Topic must follow structure "<site>/<room>/<sensor>" or "<site>/<sensor>"
		oMqttClient.subscribe(aTopics[i]);
	}
}

oMqttClient.on("message", function(sTopic, oPayload) {
	var sSite, sRoom, sSensor, aInfo;

	aInfo = sTopic.split("/");
	sSite = aInfo[0];
	sRoom = aInfo[1];
	sSensor = aInfo[2];

	if (!sSensor) { // "<site>/<sensor>" - currently not supported -> return
		sSensor = sRoom;
		sRoom = null;
		console.log(new Date() + " - Aborting message handling for topic " + sTopic +
						": Site based sensors not yet implemented");
		return;
	}

	handleSensorMessage(sSite, sRoom, sSensor, oPayload);
});

function handleSensorMessage(sSite, sRoom, sSensor, oPayload) {
	var oSite, oRoom, oSensor;

	oSite = oSites[sSite];
	if (!oSite) {
		// Creating new site
		oSite = oSites[sSite] = new Site();
		oSite.attachStateChange(handleStateChange);
	}
	oRoom = oSite.getRoom(sRoom);
	oSensor = oRoom.getSensor(sSensor);
	oSensor.setValue(oPayload);
}

function handleStateChange(oStateChange) {
	var bMotion, sSensorName, sRoom, oSensor, aLights,
		i;

	oSensor = oStateChange.oSource;
	sSensorName = oSensor.getName();

	switch (sSensorName) {
	case "Motion":
		bMotion = oSensor.getValue();
		sRoom = oSensor.getParent().getName();

		if (bMotion) {
			console.log(new Date() + " - turning on lights of " + sRoom);
		} else {
			console.log(new Date() + " - turning off lights of " + sRoom);
		}

		aLights = oLightGroups[sRoom].aLights;
		for (i = aLights.length - 1; i >= 0; i--) {
			if (bMotion) {
				aLights[i].setState({bri: 176, sat: 204, ct: 451, hue: 13393});
				aLights[i].on();
			} else {
				aLights[i].off();
			}
		}

		break;
	default:
		break;
	}
}

start();
