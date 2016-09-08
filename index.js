var debug = require("debug")("hercules:main"),
	oConfig = require("./config.json"),
	Site = require("./lib/zones/site.js"),
	HueWrapper = require("./lib/hue/hueWrapper.js"),
	MqttClient = require("./lib/mqtt/mqtt.js"),

	oHueWrapper,
	mSites = {};

if (!oConfig.brokerUrl || !oConfig.topics || !oConfig.mqttTopicRoomToHueGroupMapping) {
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
		console.log("Hue connection initialization failed:");
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
		oSite = mSites[sSite] = new Site({
			sName: sSite,
			oHueWrapper: oHueWrapper,
			oConfig: oConfig
		});
		oSite.attachConditionChange(handleConditionChange);
		oSite.attachSensorChange(handleSensorChange);
	}

	if (sRoom === null) { // Site based sensor
		oSensor = oSite.getSensor(sSensor);
	} else {
		oRoom = oSite.getRoom(sRoom);
		oSensor = oRoom.getSensor(sSensor);
	}

	oSensor.setValue(oPayload);
}

function handleConditionChange(oConditionChange) {
	var sConditionName,
		oCondition;

	oCondition = oConditionChange.oSource;
	sConditionName = oCondition.getName();

	debug("State of Condition %s (%s) changed", sConditionName, oCondition.getParent().getName());

	switch (sConditionName) {
	case "Tracker":
		handleSite(oCondition.getParent());
		break;
	default:
		debug("Unhandled condition %s", sConditionName);
		break;
	}
}

function handleSensorChange(oSensorChange) {
	var sSensorName,
		oSensor;

	oSensor = oSensorChange.oSource;
	sSensorName = oSensor.getName();

	debug("State of sensor %s (%s) changed to %s", sSensorName, oSensor.getParent().getName(), oSensor.getValue());

	switch (sSensorName) {
	case "Motion":
		handleRoom(oSensor.getParent());
		break;
	case "Luminosity":
		handleSite(oSensor.getParent().getParent());
		break;
	default:
		debug("Unhandled sensor %s", sSensorName);
		break;
	}
}

function handleSite(oSite) {
	var sName, mRooms;

	mRooms = oSite.getRooms();
	for (sName in mRooms) {
		if (mRooms.hasOwnProperty(sName)) {
			handleRoom(mRooms[sName]);
		}
	}
}

function handleRoom(oRoom) {
	oRoom.updateLight();
}
