function Tracker(oSite) {
	this._oSite = oSite;
	this._oPosition = {
		sRoom: null
	};
	oSite.attachStateChange(this.handleStateChange.bind(this));
}

Tracker.prototype = {
	handleStateChange: function(oStateChange) {
		var oSensor;

		oSensor = oStateChange.oSource;

		if (oSensor.getName() === "Motion" && oSensor.getValue() === true) {
			// Motion!
			this._oPosition.sRoom = oSensor.getParent().getName();
		}
	},

	isInRoom: function(sRoom) {
		return sRoom === this._oPosition.sRoom;
	}
};

module.exports = Tracker;
