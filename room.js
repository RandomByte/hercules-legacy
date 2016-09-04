var sensors = require("./sensor.js").sensors;

function Room(sName, oParent) {
	this._sName = sName;
	this._oParent = oParent;
	this._mSensors = {};
}

Room.prototype = {
	getName: function() {
		return this._sName;
	},

	getParent: function() {
		return this._oParent;
	},

	getSensor: function(sSensor) {
		return this._mSensors[sSensor] || this.createSensor(sSensor);
	},

	getSensors: function() {
		return this._mSensors;
	},

	createSensor: function(sSensor) {
		var oSensor;

		switch (sSensor) {
		case "Motion":
			oSensor = new sensors.MotionSensor(sSensor, this);
			break;
		default:
			oSensor = new sensors.Sensor(sSensor, this);
			break;
		}

		this._mSensors[sSensor] = oSensor;
		return oSensor;
	},

	isOccupied: function() {
		return this.getParent().getTracker().isInRoom(this._sName);
	},

	handleStateChange: function(oStateChange) {
		this.getParent().handleStateChange(oStateChange);
	}
};

module.exports = Room;
