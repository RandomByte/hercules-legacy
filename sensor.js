function Sensor(sName, oParent) {
	this.sName = sName;
	this.oParent = oParent;

	this.vLastValue = null;
	this.vValue = null;
}

Sensor.prototype.getName = function() {
	return this.sName;
};

Sensor.prototype.getParent = function() {
	return this.oParent;
};

Sensor.prototype.setValue = function(vValue) {
	var vParsedValue;
	vParsedValue = this.parseValue(vValue);

	if (vParsedValue === this.vValue) {
		// Value hasn't changed
		return;
	}

	this.vLastValue = this.vValue;
	this.vValue = vParsedValue;
	this.handleValueChange();
};

Sensor.prototype.getValue = function() {
	return this.vValue;
};

Sensor.prototype.parseValue = function(vValue) {
	return vValue;
};

Sensor.prototype.handleValueChange = function() {
	this.oParent.handleStateChange({
		oSource: this
	});
	return;
};

/* Motion sensor */
function MotionSensor() {
	Sensor.apply(this, arguments);
}

MotionSensor.prototype = Object.create(Sensor.prototype);
MotionSensor.prototype.constructor = Sensor;

MotionSensor.prototype.parseValue = function(vValue) {
	// Value is "0" or "1"
	// -> parsing to true or false
	return Boolean(parseInt(vValue, 10));
};

module.exports.sensors = {
	Sensor: Sensor,
	MotionSensor: MotionSensor
};
