var sensors = require("./sensor.js").sensors;

function Room(sName, oParent) {
	this.sName = sName;
	this.oParent = oParent;
	this.mSensors = {};
}

Room.prototype.getName = function() {
	return this.sName;
};

Room.prototype.getParent = function() {
	return this.oParent;
};

Room.prototype.getSensor = function(sSensor) {
	return this.mSensors[sSensor] || this.createSensor(sSensor);
};

Room.prototype.getSensors = function() {
	return this.mSensors;
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

	this.mSensors[sSensor] = oSensor;
	return oSensor;
};

Room.prototype.isOccupied = function() {
	return this.getParent().getTracker().isInRoom(this.sName);
};

Room.prototype.handleStateChange = function(oStateChange) {
	this.oParent.handleStateChange(oStateChange);
};

module.exports = Room;
