function Sensor(sName, oParent) {
	this._sName = sName;
	this._oParent = oParent;

	this._vLastValue = null;
	this._vValue = null;
}

Sensor.prototype = {
	getName: function() {
		return this._sName;
	},

	getParent: function() {
		return this._oParent;
	},

	setValue: function(vValue) {
		var vParsedValue;
		vParsedValue = this._parseValue(vValue);

		if (vParsedValue === this._vValue) {
			// Value hasn't changed
			return;
		}

		this._vLastValue = this._vValue;
		this._vValue = vParsedValue;
		this._handleValueChange();
	},

	getValue: function() {
		return this._vValue;
	},

	_parseValue: function(vValue) {
		return vValue;
	},

	_handleValueChange: function() {
		this.getParent().handleStateChange({
			oSource: this
		});
		return;
	}
};

/* Motion sensor */
function MotionSensor() {
	Sensor.apply(this, arguments);
}

MotionSensor.prototype = Object.create(Sensor.prototype);
MotionSensor.prototype.constructor = Sensor;

MotionSensor.prototype._parseValue = function(vValue) {
	// Value is "0" or "1"
	// -> parsing to true or false
	return Boolean(parseInt(vValue, 10));
};

module.exports.sensors = {
	Sensor: Sensor,
	MotionSensor: MotionSensor
};
