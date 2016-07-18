var mqtt = require("mqtt");

function MqttClient(sBrokerUrl, aTopics) {
	var that = this;

	this.aMessageHandler = [];

	this.oMqttClient = mqtt.connect(sBrokerUrl);
	console.log("MQTT Broker URL: " + sBrokerUrl);

	this.oMqttClient.on("message", function(sTopic, oPayload) {
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

		that.handleSensorMessage({
			sSite: sSite,
			sRoom: sRoom,
			sSensor: sSensor,
			oPayload: oPayload
		});
	});
	this.subscribeToTopics(aTopics);
}

MqttClient.prototype.subscribeToTopics = function(aTopics) {
	// Topics must follow structure "<site>/<room>/<sensor>" or "<site>/<sensor>"
	this.oMqttClient.subscribe(aTopics, {
		qos: 2
	});
};

MqttClient.prototype.attachSensorMessage = function(callback) {
	this.aMessageHandler.push(callback);
};

MqttClient.prototype.detachSensorMessage = function(callback) {
	var idx;
	idx = this.aMessageHandler.indexOf(callback);
	if (idx > -1) {
		this.aMessageHandler.splice(idx, 1);
	}
};

MqttClient.prototype.handleSensorMessage = function(oMessage) {
	var i;
	for (i = 0; i < this.aMessageHandler.length; i++) {
		this.aMessageHandler[i](oMessage);
	}
};

module.exports = MqttClient;
