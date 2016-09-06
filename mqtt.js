var mqtt = require("mqtt");

function MqttClient(sBrokerUrl, aTopics) {
	var that = this;

	this._aMessageHandler = [];

	this._oMqttClient = mqtt.connect(sBrokerUrl);
	console.log("MQTT Broker URL: " + sBrokerUrl);

	this._oMqttClient.on("message", function(sTopic, oPayload) {
		var sSite, sRoom, sSensor, aInfo;

		aInfo = sTopic.split("/");
		sSite = aInfo[0];
		sRoom = aInfo[1];
		sSensor = aInfo[2];

		if (!sSensor) { // "<site>/<sensor>"
			sSensor = sRoom;
			sRoom = null;
		}

		that._handleSensorMessage({
			sSite: sSite,
			sRoom: sRoom,
			sSensor: sSensor,
			oPayload: oPayload
		});
	});
	this.subscribeToTopics(aTopics);
}

MqttClient.prototype = {
	subscribeToTopics: function(aTopics) {
		// Topics must follow structure "<site>/<room>/<sensor>" or "<site>/<sensor>"
		this._oMqttClient.subscribe(aTopics, {
			qos: 2
		});
	},

	attachSensorMessage: function(callback) {
		this._aMessageHandler.push(callback);
	},

	detachSensorMessage: function(callback) {
		var idx;
		idx = this._aMessageHandler.indexOf(callback);
		if (idx > -1) {
			this._aMessageHandler.splice(idx, 1);
		}
	},

	_handleSensorMessage: function(oMessage) {
		var i;
		for (i = 0; i < this._aMessageHandler.length; i++) {
			this._aMessageHandler[i](oMessage);
		}
	}
};

module.exports = MqttClient;
