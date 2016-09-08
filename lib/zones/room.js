var debug = require("debug")("hercules:room"),
	sensors = require("../sensors/sensor.js").sensors;

/* oParams:
	sName
	oParent
	oConfig
*/
function Room(oParams) {
	this._sName = oParams.sName;
	this._oParent = oParams.oParent;
	this._oConfig = oParams.oConfig;

	this._mSensors = {};

	if (this._oConfig.mqttTopicRoomToHueGroupMapping) {
		// Do the mapping between mqtt topic names and hue names
		this._sHueName = this._oConfig.mqttTopicRoomToHueGroupMapping[this._sName] || this._sName;
	}
}

Room.prototype = {
	getName: function() {
		return this._sName;
	},

	getHueName: function() {
		return this._sHueName;
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
			oSensor = new sensors.MotionSensor({
				sName: sSensor,
				oParent: this
			});
			break;
		case "Luminosity":
			oSensor = new sensors.LuminositySensor({
				sName: sSensor,
				oParent: this
			});
			break;
		default:
			oSensor = new sensors.Sensor({
				sName: sSensor,
				oParent: this
			});
			break;
		}

		this._mSensors[sSensor] = oSensor;
		return oSensor;
	},

	isOccupied: function() {
		return this.getParent().getTracker().isInRoom(this._sName);
	},

	handleSensorChange: function(oSensorChange) {
		this.getParent().handleSensorChange(oSensorChange);
	},

	updateLight: function() {
		var bMotion, iLum, oSite;

		/* Occupancy check */
		bMotion = this.getSensor("Motion").getValue();
		if (!bMotion && this.isOccupied()) {
			debug("[No Action]: Motion stopped but somebody is in the room");
			return; // => do nothing
		}

		/* Luminosity check */
		if (bMotion) {
			oSite = this.getParent();
			iLum = oSite.getSensor("Luminosity").getValue();
			if (iLum > 3) {
				debug("[No Action]: Too bright");
				return; // => do nothing
			}
		}

		this._switchLight(bMotion);
	},

	_switchLight: function(bOn) {
		// Hand over to hue
		this.getParent().getHueWrapper().handleGroup(this.getHueName(), bOn);
	}
};

module.exports = Room;
