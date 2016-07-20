var Room = require("./room.js"),
	Tracker = require("./tracker.js");

function Site() {
	this._mRooms = {};
	this._aStateChangeListeners = [];
	this._oTracker = new Tracker(this);
}

Site.prototype.getRoom = function(sRoom) {
	return this._mRooms[sRoom] || this.createRoom(sRoom);
};

Site.prototype.getRooms = function() {
	return this._mRooms;
};

Site.prototype.getTracker = function() {
	return this._oTracker;
};

Site.prototype.createRoom = function(sRoom) {
	var oRoom;
	this._mRooms[sRoom] = oRoom = new Room(sRoom, this);
	return oRoom;
};

Site.prototype.attachStateChange = function(callback) {
	this._aStateChangeListeners.push(callback);
};

Site.prototype.detachStateChange = function(callback) {
	var idx;
	idx = this._aStateChangeListeners.indexOf(callback);
	if (idx > -1) {
		this._aStateChangeListeners.splice(idx, 1);
	}
};

Site.prototype.handleStateChange = function(oStateChange) {
	var i;
	for (i = 0; i < this._aStateChangeListeners.length; i++) {
		this._aStateChangeListeners[i](oStateChange);
	}
};

module.exports = Site;
