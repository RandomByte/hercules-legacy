function Tracker(oSite) {
	this.oSite = oSite;
	this.oPosition = {
		sRoom: null
	};
	oSite.attachStateChange(this.handleStateChange.bind(this));
}

Tracker.prototype.handleStateChange = function(oStateChange) {
	var oSensor;

	oSensor = oStateChange.oSource;

	if (oSensor.getName() === "Motion" && oSensor.getValue() === true) {
		// Motion!
		this.oPosition.sRoom = oSensor.getParent().getName();
	}
};

Tracker.prototype.isInRoom = function(sRoom) {
	return sRoom === this.oPosition.sRoom;
};

module.exports = Tracker;
