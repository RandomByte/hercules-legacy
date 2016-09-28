var debug = require("debug")("hercules:room"),
	sensors = require("../sensors/sensor.js").sensors;

/* oParams:
	sName
	oParent
	oConfig
*/
class Room {
	constructor(oParams) {
		this._sName = oParams.sName;
		this._oParent = oParams.oParent;
		this._oConfig = oParams.oConfig;

		this._mSensors = {};

		if (this._oConfig.mqttTopicRoomToHueGroupMapping) {
			// Do the mapping between mqtt topic names and hue names
			this._sHueName = this._oConfig.mqttTopicRoomToHueGroupMapping[this._sName] || this._sName;
		}
	}

	getName() {
		return this._sName;
	}

	getHueName() {
		return this._sHueName;
	}

	getParent() {
		return this._oParent;
	}

	getSensor(sSensor) {
		return this._mSensors[sSensor] || this.createSensor(sSensor);
	}

	getSensors() {
		return this._mSensors;
	}

	createSensor(sSensor) {
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
	}

	isOccupied() {
		return this.getParent().getRoomTracker().isInRoom(this._sName);
	}

	handleSensorChange(oSensorChange) {
		this.getParent().handleSensorChange(oSensorChange);
	}

	updateLight() {
		if (this._oUpdateLightTimeout) {
			clearTimeout(this._oUpdateLightTimeout);
		}

		this._oUpdateLightTimeout = setTimeout(this._updateLight.bind(this));
	}

	_updateLight() {
		var bMotion, iPresenceScore, iLum, oSite;

		oSite = this.getParent();

		iPresenceScore = oSite.getPresenceScorer().getScore();
		if (iPresenceScore === 0) {
			debug("[%s] Action: No sign of presence -> switch light off", this._sName);
			this._switchLight(false);
			return;
		}

		bMotion = this.getSensor("Motion").getValue();

		/* Occupancy check */
		if (!bMotion && this.isOccupied()) {
			debug("[%s] No Action: Motion stopped but somebody is in the room", this._sName);
			return; // => do nothing
		}

		/* Luminosity check */
		if (bMotion) {
			iLum = oSite.getSensor("Luminosity").getValue();
			if (iLum > 3) {
				debug("[%s] No Action: Too bright", this._sName);
				return; // => do nothing
			}
		}

		if (bMotion && iPresenceScore === 1) {
			debug("[%s] Action: Unconfirmed presence -> turning light on for 10 seconds",
				this._sName);
			if (!this._oUnconfirmedPresenceTimeout) {
				this._oUnconfirmedPresenceTimeout = setTimeout(function() {
					this._oUnconfirmedPresenceTimeout = null;
					debug("[%s] Action: Presence could not be confirmed in time - turning light off", this._sName);
					this._switchLight(false);
				}.bind(this), 10000);
			}
		} else if (this._oUnconfirmedPresenceTimeout && bMotion && iPresenceScore > 1) {
			// Confirmed presence while we were waiting for confirmation -> cancel timeout
			clearTimeout(this._oUnconfirmedPresenceTimeout);
		}

		this._switchLight(bMotion);
	}

	_switchLight(bOn) {
		// Hand over to hue
		this.getParent().getHueWrapper().handleGroup(this.getHueName(), bOn);
	}
}

module.exports = Room;
