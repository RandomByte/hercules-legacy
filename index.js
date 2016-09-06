var debug = require("debug")("hercules:main"),
	oConfig = require("./config.json"),
	Site = require("./site.js"),
	HueWrapper = require("./hueWrapper.js"),
	MqttClient = require("./mqtt.js"),

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
		oSite = mSites[sSite] = new Site(sSite);
		oSite.attachStateChange(handleStateChange);
	}

	if (sRoom === null) { // Site based sensor
		oSensor = oSite.getSensor(sSensor);
	} else {
		oRoom = oSite.getRoom(sRoom);
		oSensor = oRoom.getSensor(sSensor);
	}

	oSensor.setValue(oPayload);
}

function handleStateChange(oStateChange) {
	var sSensorName,
		oSensor;

	oSensor = oStateChange.oSource;
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
		break;
	}
}

function handleRoom(oRoom) {
	var bMotion, iLum, sRoom, sHueRoom,
		oSite;

	sRoom = oRoom.getName();
	debug("Handling room %s", sRoom);

	if (oConfig.mqttTopicRoomToHueGroupMapping) {
		// Do the mapping between mqtt topic names and hue names
		sHueRoom = oConfig.mqttTopicRoomToHueGroupMapping[sRoom] || sRoom;
	}

	/* Occupancy check */
	bMotion = oRoom.getSensor("Motion").getValue();
	if (!bMotion && oRoom.isOccupied()) {
		debug("[No Action]: No motion but somebody is in the room");
		return; // => do nothing
	}

	/* Luminosity check */
	if (bMotion) {
		oSite = oRoom.getParent();
		iLum = oSite.getSensor("Luminosity").getValue();
		if (iLum > 3) {
			debug("[No Action]: Too bright");
			return; // => do nothing
		}
	}

	// Hand over to hue
	oHueWrapper.handleGroup(sHueRoom, bMotion);
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
