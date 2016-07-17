var Room = require("./room.js");

function Site() {
	this.mRooms = {};
	this.aStateChangeListeners = [];
}

Site.prototype.getRoom = function(sRoom) {
	return this.mRooms[sRoom] || this.createRoom(sRoom);
};

Site.prototype.getRooms = function() {
	return this.mRooms;
};

Site.prototype.createRoom = function(sRoom) {
	var oRoom;
	this.mRooms[sRoom] = oRoom = new Room(sRoom, this);
	return oRoom;
};

Site.prototype.attachStateChange = function(callback) {
	this.aStateChangeListeners.push(callback);
};

Site.prototype.detachStateChange = function(callback) {
	var idx;
	idx = this.aStateChangeListeners.indexOf(callback);
	if (idx > -1) {
		this.aStateChangeListeners.splice(idx, 1);
	}
};

Site.prototype.handleStateChange = function(oStateChange) {
	var i;
	for (i = 0; i < this.aStateChangeListeners.length; i++) {
		this.aStateChangeListeners[i](oStateChange);
	}
};

module.exports = Site;
