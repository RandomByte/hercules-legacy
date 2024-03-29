var debug = require("debug")("hercules:main"),
	path = require("path"),
	oConfig = require("./config.json"),
	Site = require("./lib/site/site.js"),
	HueWrapper = require("./lib/hue/hueWrapper.js"),
	MqttClient = require("./lib/mqtt/mqtt.js"),
	SystemState = require("./lib/system/systemState.js"),
	RestServer = require("./lib/api/restServer.js"),

	oHueWrapper, oRestServer, oSystemState,
	mSites = {};

if (!oConfig.brokerUrl || !oConfig.topics || !oConfig.mqttTopicRoomToHueGroupMapping || !oConfig.iHttpPort) {
	console.log("There's something missing in your config.json, please refer to config.example.json for an example");
	process.exit(1);
}

oSystemState = new SystemState();

oRestServer = new RestServer({
	oSystemState: oSystemState
});

oHueWrapper = new HueWrapper({
	sHueConfigPath: path.join(__dirname, ".hueConfig.json")
});

oHueWrapper.getReady()
	.then(function() {
		var oMqtt;
		debug("Hue Wrapper ready. Connecting to MQTT broker...");
		oMqtt = new MqttClient(oConfig.brokerUrl, oConfig.topics);
		oMqtt.attachSensorMessage(function(oMessage) {
			handleSensorMessage(oMessage);
		});
		oRestServer.init(oConfig.iHttpPort);
	})
	.catch(function(err) {
		console.log("Hue connection initialization failed:");
		console.log(err);
	});

function handleSensorMessage(oMessage) {
	var sSite, sRoom, sSensor,
		oPayload, oSite, oRoom, oSensor;

	if (!oSystemState.getProcessSensorInput()) {
		return;
	}

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
	}

	if (sRoom === null) { // Site based sensor
		oSensor = oSite.getSensor(sSensor);
	} else {
		oRoom = oSite.getRoom(sRoom);
		oSensor = oRoom.getSensor(sSensor);
	}

	oSensor.setValue(oPayload);
}
