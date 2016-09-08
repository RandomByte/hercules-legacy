var debug = require("debug")("hercules:tracker"),
	Condition = require("./condition.js");

/* oParams:
	oParent
*/
function Tracker(oParams) {
	Condition.apply(this, arguments);

	this._oPosition = {
		sRoom: null
	};
	this.getParent().attachSensorChange(this._handleSensorChange.bind(this));
}

Tracker.prototype = Object.create(Condition.prototype);
Tracker.prototype.constructor = Condition;

Tracker.prototype.getPosition = function() {
	return this._oPosition;
};

Tracker.prototype._handleSensorChange = function(oStateChange) {
	var oSensor;

	oSensor = oStateChange.oSource;

	if (oSensor.getName() === "Motion" && oSensor.getValue() === true) {
		// Motion!
		this.getPosition().sRoom = oSensor.getParent().getName();
		debug("Position changed to room %s", this.getPosition().sRoom);

		this._handleConditionChange();
	}
};

Tracker.prototype.isInRoom = function(sRoom) {
	return sRoom === this.getPosition().sRoom;
};

module.exports = Tracker;
