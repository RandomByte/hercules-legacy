var sensors = require("./sensor.js").sensors;

function Room(sName, oParent) {
	this._sName = sName;
	this._oParent = oParent;
	this._mSensors = {};
}

Room.prototype.getName = function() {
	return this._sName;
};

Room.prototype.getParent = function() {
	return this._oParent;
};

Room.prototype.getSensor = function(sSensor) {
	return this._mSensors[sSensor] || this.createSensor(sSensor);
};

Room.prototype.getSensors = function() {
	return this._mSensors;
};

Room.prototype.createSensor = function(sSensor) {
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
};

Room.prototype.isOccupied = function() {
	return this.getParent().getTracker().isInRoom(this._sName);
};

Room.prototype.handleStateChange = function(oStateChange) {
	this.getParent().handleStateChange(oStateChange);
};

module.exports = Room;
