var oConfig = require("./config.json"),
	Site = require("./site.js"),
	Hue = require("./hue.js"),
	MqttClient = require("./mqtt.js"),

	oHue,
	mSites = {},
	mHandledLights = {},
	mHandledGroups = {};

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
	var bMotion,
		sSensorName, sRoom, sHueRoom,
		oSensor, oGroup;

	oSensor = oStateChange.oSource;
	sSensorName = oSensor.getName();

	switch (sSensorName) {
	case "Motion":
		bMotion = oSensor.getValue();
		sRoom = oSensor.getParent().getName();

		if (oConfig.mqttTopicRoomToHueGroupMapping) {
			// Do the mapping
			sHueRoom = oConfig.mqttTopicRoomToHueGroupMapping[sRoom] || sRoom;
		}

		oGroup = oHue.getGroupByName(sHueRoom);
		handleGroup(oGroup.sId, bMotion);
		break;
	default:
		break;
	}
}

function handleGroup(iGroupId, bOn) {
	// Load group to
	//	a) check if we are allowed to handle it
	//	b) change it's properties to save them back
	return oHue.getClient().groups.getById(iGroupId).then(function(oGroup) {
		var iLightId, oMetaGroup, i;

		oMetaGroup = mHandledGroups[iGroupId];
		if (oGroup.on && !oMetaGroup) {
			// We won't handle this group
			// -> fallback to lights
			for (i = oGroup.aLightIds.length - 1; i >= 0; i--) {
				iLightId = oGroup.aLightIds[i];
				handleLight(iLightId, bOn);
			}
			return;
		}
		if (!oMetaGroup) {
			oMetaGroup = mHandledGroups[iGroupId] = {};
		}

		oGroup.on = bOn;
		if (bOn) {
			console.log("Turning on group " + oGroup.name);
			oGroup.brightness = 184;
			oGroup.hue = 8411;
			oGroup.saturation = 140;
			return oHue.getClient().groups.save(oGroup);
		}
		if (oMetaGroup.oOffTimeout) {
			clearTimeout(oMetaGroup.oOffTimeout);
		}
		oMetaGroup.oOffTimeout = setTimeout(function() {
			console.log("Turning off group " + oGroup.name);
			oHue.getClient().groups.save(oGroup);
			mHandledGroups[iGroupId] = null;
		}, 5000);
	})
	.catch(function(err) {
		console.log(err);
		console.log("Failed to update group");
	});
}

function handleLight(iLightId, bOn) {
	// Load light to
	//	a) check if we are allowed to handle it
	//	b) change it's properties to save them back
	return oHue.getClient().lights.getById(iLightId).then(function(oLight) {
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
			mHandledLights[iLightId] = null;
		}, 5000);
	})
	.catch(function(err) {
		console.log(err);
		console.log("Failed to update light");
	});
}
