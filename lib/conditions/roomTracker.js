var debug = require("debug")("hercules:Roomtracker"),
	Condition = require("./condition.js");

/* oParams:
	sName
	oParent
*/
class RoomTracker extends Condition {
	constructor(oParams) {
		super(oParams);

		this._oPosition = {
			sRoom: null
		};
		this.getParent().attachSensorChange(this._handleSensorChange.bind(this));
	}

	getPosition() {
		return this._oPosition;
	}

	getLogValue() {
		return this.getPosition().sRoom;
	}

	_handleSensorChange(oStateChange) {
		var oSensor;

		oSensor = oStateChange.oSource;

		if (oSensor.getName() === "Motion" && oSensor.getValue() === true) {
			// Motion!
			this._oPosition.sRoom = oSensor.getParent().getName();
			debug("Position changed to room %s", this._oPosition.sRoom);

			this._handleConditionChange();
		}
	}

	isInRoom(sRoom) {
		return sRoom === this.getPosition().sRoom;
	}
}

module.exports = RoomTracker;
