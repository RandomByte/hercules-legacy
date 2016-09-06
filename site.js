var Room = require("./room.js"),
	Tracker = require("./tracker.js");

function Site(sName) {
	this._sName = sName;
	this._mRooms = {};
	this._aStateChangeListeners = [];
	this._oTracker = new Tracker(this);
	this._oSiteRoom = new Room("<" + sName + ">", this);
}

Site.prototype = {
	getRoom: function(sRoom) {
		return this._mRooms[sRoom] || this.createRoom(sRoom);
	},

	getRooms: function() {
		return this._mRooms;
	},

	getTracker: function() {
		return this._oTracker;
	},

	createRoom: function(sRoom) {
		var oRoom;
		this._mRooms[sRoom] = oRoom = new Room(sRoom, this);
		return oRoom;
	},

	attachStateChange: function(callback) {
		this._aStateChangeListeners.push(callback);
	},

	detachStateChange: function(callback) {
		var idx;
		idx = this._aStateChangeListeners.indexOf(callback);
		if (idx > -1) {
			this._aStateChangeListeners.splice(idx, 1);
		}
	},

	handleStateChange: function(oStateChange) {
		var i;
		for (i = 0; i < this._aStateChangeListeners.length; i++) {
			this._aStateChangeListeners[i](oStateChange);
		}
	},

	getSensor: function() {
		return this._oSiteRoom.getSensor.apply(this._oSiteRoom, arguments);
	}
};

module.exports = Site;
