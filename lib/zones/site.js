var Room = require("./room.js"),
	PresenceScorer = require("../conditions/presenceScorer.js"),
	RoomTracker = require("../conditions/roomTracker.js");

/* oParams:
	sName
	oHueWrapper
	oConfig
*/
function Site(oParams) {
	this._sName = oParams.sName;
	this._oHueWrapper = oParams.oHueWrapper;
	this._oConfig = oParams.oConfig;

	this._mRooms = {};
	this._aConditionChangeListeners = [];
	this._aSensorChangeListeners = [];

	this._oPresenceScorer = new PresenceScorer({
		sName: "PresenceScorer",
		oParent: this
	});

	this._oRoomTracker = new RoomTracker({
		sName: "RoomTracker",
		oParent: this
	});

	this._oSiteRoom = new Room({
		sName: "<" + this._sName + ">",
		oParent: this,
		oConfig: this._oConfig
	});
}

Site.prototype = {
	getName: function() {
		return this._sName;
	},

	getRoom: function(sRoom) {
		return this._mRooms[sRoom] || this.createRoom(sRoom);
	},

	getRooms: function() {
		return this._mRooms;
	},

	getRoomTracker: function() {
		return this._oRoomTracker;
	},

	getPresenceScorer: function() {
		return this._oPresenceScorer;
	},

	createRoom: function(sRoom) {
		var oRoom;
		this._mRooms[sRoom] = oRoom = new Room({
			sName: sRoom,
			oParent: this,
			oConfig: this._oConfig
		});
		return oRoom;
	},

	attachConditionChange: function(callback) {
		this._aConditionChangeListeners.push(callback);
	},

	detachConditionChange: function(callback) {
		var idx;
		idx = this._aConditionChangeListeners.indexOf(callback);
		if (idx > -1) {
			this._aConditionChangeListeners.splice(idx, 1);
		}
	},

	handleConditionChange: function(oConditionChange) {
		var i;
		for (i = 0; i < this._aConditionChangeListeners.length; i++) {
			this._aConditionChangeListeners[i](oConditionChange);
		}
	},

	attachSensorChange: function(callback) {
		this._aSensorChangeListeners.push(callback);
	},

	detachSensorChange: function(callback) {
		var idx;
		idx = this._aSensorChangeListeners.indexOf(callback);
		if (idx > -1) {
			this._aSensorChangeListeners.splice(idx, 1);
		}
	},

	handleSensorChange: function(oSensorChange) {
		var i;
		for (i = 0; i < this._aSensorChangeListeners.length; i++) {
			this._aSensorChangeListeners[i](oSensorChange);
		}
	},

	getSensor: function() {
		return this._oSiteRoom.getSensor.apply(this._oSiteRoom, arguments);
	},

	getHueWrapper: function() {
		return this._oHueWrapper;
	}
};

module.exports = Site;
