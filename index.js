var oConfig = require("./config.json"),
	Site = require("./site.js"),
	Hue = require("./hue.js"),
	MqttClient = require("./mqtt.js"),

	oHue,
	mSites = {},
	mHandledLights = {};

if (!oConfig.brokerUrl || !oConfig.topics) {
	console.log("There's something missing in your config.json, please refer to config.example.json for an example");
	process.exit(1);
}

oHue = new Hue();
oHue.ready
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
	var bMotion, iLightId,
		sSensorName, sRoom, sHueRoom,
		oSensor, aLightIds,
		i;

	oSensor = oStateChange.oSource;
	sSensorName = oSensor.getName();

	switch (sSensorName) {
	case "Motion":
		bMotion = oSensor.getValue();
		sRoom = oSensor.getParent().getName();

		if (oConfig.mqttTopicRoomToHueGroupMapping) {
			sHueRoom = oConfig.mqttTopicRoomToHueGroupMapping[sRoom] || sRoom;
		}

		aLightIds = oHue.getGroupByName(sHueRoom).aLightIds;

		for (i = aLightIds.length - 1; i >= 0; i--) {
			iLightId = aLightIds[i];
			handleLight(iLightId, bMotion);
		}

		break;
	default:
		break;
	}
}

function handleLight(iLightId, bOn) {
	// Load light to
	//	a) check if we are allowed to handle it
	//	b) change it's properties to save them back
	oHue.getClient().lights.getById(iLightId).then(function(oLight) {
		var oMetaLight;

		oMetaLight = mHandledLights[iLightId];
		if (oLight.on && !oMetaLight) {
			// We won't handle this light
			return;
		}
		if (!oMetaLight) {
			oMetaLight = mHandledLights[iLightId] = {};
		}

		oLight.on = bOn;
		if (bOn) {
			console.log("Turning on light " + oLight.name);
			oLight.brightness = 184;
			oLight.hue = 8411;
			oLight.saturation = 140;
			return oHue.getClient().lights.save(oLight);
		}
		if (oMetaLight.oOffTimeout) {
			clearTimeout(oMetaLight.oOffTimeout);
		}
		oMetaLight.oOffTimeout = setTimeout(function() {
			console.log("Turning off light " + oLight.name);
			oHue.getClient().lights.save(oLight);
		}, 5000);
	})
	.catch(function(err) {
		console.log(err);
		console.log("Failed to update light");
	});
}
