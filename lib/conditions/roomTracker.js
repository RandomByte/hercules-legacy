var debug = require("debug")("hercules:Roomtracker"),
	Condition = require("./condition.js");

/* oParams:
	oParent
*/
function RoomTracker(oParams) {
	Condition.apply(this, arguments);

	this._oPosition = {
		sRoom: null
	};
	this.getParent().attachSensorChange(this._handleSensorChange.bind(this));
}

RoomTracker.prototype = Object.create(Condition.prototype);
RoomTracker.prototype.constructor = Condition;

RoomTracker.prototype.getPosition = function() {
	return this._oPosition;
};

RoomTracker.prototype.getLogValue = function() {
	return this.getPosition().sRoom;
};

RoomTracker.prototype._handleSensorChange = function(oStateChange) {
	var oSensor;

	oSensor = oStateChange.oSource;

	if (oSensor.getName() === "Motion" && oSensor.getValue() === true) {
		// Motion!
		this._oPosition.sRoom = oSensor.getParent().getName();
		debug("Position changed to room %s", this._oPosition.sRoom);

		this._handleConditionChange();
	}
};

RoomTracker.prototype.isInRoom = function(sRoom) {
	return sRoom === this.getPosition().sRoom;
};

module.exports = RoomTracker;
