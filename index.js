var oConfig = require("./config.json"),
	Site = require("./site.js"),
	HueWrapper = require("./hueWrapper.js"),
	MqttClient = require("./mqtt.js"),

	oHueWrapper,
	mSites = {};

if (!oConfig.brokerUrl || !oConfig.topics) {
	console.log("There's something missing in your config.json, please refer to config.example.json for an example");
	process.exit(1);
}

oHueWrapper = new HueWrapper();

oHueWrapper.getReady()
	.then(function() {
		var oMqtt;

		oMqtt = new MqttClient(oConfig.brokerUrl, oConfig.topics);
		oMqtt.attachSensorMessage(function(oMessage) {
			handleSensorMessage(oMessage);
		});
	})
	.catch(function(err) {
		console.log(err);
	});

function handleSensorMessage(oMessage) {
	var sSite, sRoom, sSensor,
		oPayload, oSite, oRoom, oSensor;

	sSite = oMessage.sSite;
	sRoom = oMessage.sRoom;
	sSensor = oMessage.sSensor;
	oPayload = oMessage.oPayload;

	oSite = mSites[sSite];
	if (!oSite) {
		// Creating new site
		oSite = mSites[sSite] = new Site();
		oSite.attachStateChange(handleStateChange);
	}
	oRoom = oSite.getRoom(sRoom);
	oSensor = oRoom.getSensor(sSensor);
	oSensor.setValue(oPayload);
}

function handleStateChange(oStateChange) {
	var sSensorName,
		oSensor;

	oSensor = oStateChange.oSource;
	sSensorName = oSensor.getName();

	switch (sSensorName) {
	case "Motion":
		handleRoom(oSensor.getParent());
		break;
	default:
		break;
	}
}

function handleRoom(oRoom) {
	var bMotion, sRoom, sHueRoom;

	sRoom = oRoom.getName();

	if (oConfig.mqttTopicRoomToHueGroupMapping) {
		// Do the mapping
		sHueRoom = oConfig.mqttTopicRoomToHueGroupMapping[sRoom] || sRoom;
	}

	bMotion = oRoom.getSensor("Motion").getValue();
	if (!bMotion && oRoom.isOccupied()) {
		return; // Do nothing
	}

	oHueWrapper.handleGroup(sHueRoom, bMotion);
}
