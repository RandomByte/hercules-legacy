
/* oParams:
	sName
	oParent
*/
class Sensor {
	constructor(oParams) {
		this._sName = oParams.sName;
		this._oParent = oParams.oParent;

		this._vLastValue = null;
		this._vValue = null;
	}

	getName() {
		return this._sName;
	}

	getParent() {
		return this._oParent;
	}

	setValue(vValue) {
		var vParsedValue;
		vParsedValue = this._parseValue(vValue);

		if (vParsedValue === this._vValue) {
			// Value hasn't changed
			return;
		}

		this._vLastValue = this._vValue;
		this._vValue = vParsedValue;
		this._handleValueChange();
	}

	getValue() {
		return this._vValue;
	}

	_parseValue(vValue) {
		return vValue;
	}

	_handleValueChange() {
		this.getParent().handleSensorChange({
			oSource: this
		});
	}
}

/* Motion sensor */
class MotionSensor extends Sensor {
	_parseValue(vValue) {
		// Value is "0" or "1"
		// -> parsing to true or false
		return Boolean(parseInt(vValue, 10));
	}
}

/* Luminosity sensor */
class LuminositySensor extends Sensor {
	constructor(oParams) {
		super(oParams);

		var iSensorMax, iOutMax;

		this._iSensorMin = 0;
		this._iOutMin = 0;
		iSensorMax = 1023;
		iOutMax = 20;
		this._iSlope = (iOutMax - this._iOutMin) / (iSensorMax - this._iSensorMin);
	}

	_parseValue(vValue) {
		var iLum;
		iLum = parseInt(vValue, 10);

		// Map to range of 0-20 (see constructor for up-to-date max)
		return Math.round(this._iOutMin + this._iSlope * (iLum - this._iSensorMin));
	}
}

module.exports.sensors = {
	Sensor: Sensor,
	MotionSensor: MotionSensor,
	LuminositySensor: LuminositySensor
};
