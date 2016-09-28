var debug = require("debug")("hercules:site"),
	Room = require("./room.js"),
	PresenceScorer = require("../conditions/presenceScorer.js"),
	RoomTracker = require("../conditions/roomTracker.js");

/* oParams:
	sName
	oHueWrapper
	oConfig
*/
class Site {
	constructor(oParams) {
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

	getName() {
		return this._sName;
	}

	getRoom(sRoom) {
		return this._mRooms[sRoom] || this.createRoom(sRoom);
	}

	getRooms() {
		return this._mRooms;
	}

	getRoomTracker() {
		return this._oRoomTracker;
	}

	getPresenceScorer() {
		return this._oPresenceScorer;
	}

	createRoom(sRoom) {
		var oRoom;
		this._mRooms[sRoom] = oRoom = new Room({
			sName: sRoom,
			oParent: this,
			oConfig: this._oConfig
		});
		return oRoom;
	}

	handleSensorChange(oSensorChange) {
		var sSensorName, oSensor,
			i;

		oSensor = oSensorChange.oSource;
		sSensorName = oSensor.getName();

		debug("[%s]: State of sensor %s (%s) changed to %s", this.getName(), sSensorName,
			oSensor.getParent().getName(), oSensor.getValue());

		// Queue everything
		switch (sSensorName) {
		case "Motion":
			this._updateSingleRoom(oSensor.getParent());
			break;
		case "Luminosity":
			this._updateAllRooms();
			break;
		default:
			debug("Unhandled sensor %s", sSensorName);
			break;
		}

		// Then execute the queue which will trigger stuff and stuff and stuff
		for (i = 0; i < this._aSensorChangeListeners.length; i++) {
			this._aSensorChangeListeners[i](oSensorChange);
		}
	}

	handleConditionChange(oConditionChange) {
		var sConditionName, oCondition,
			i;

		oCondition = oConditionChange.oSource;
		sConditionName = oCondition.getName();

		debug("[%s]: State of Condition %s changed to %s", this.getName(), sConditionName, oCondition.getLogValue());

		// Queue everything
		switch (sConditionName) {
		case "RoomTracker":
			this._updateAllRooms();
			break;
		case "PresenceScorer":
			this._updateAllRooms();
			break;
		default:
			debug("Unhandled condition %s", sConditionName);
			break;
		}

		// Then execute the queue which will trigger stuff and stuff and stuff
		for (i = 0; i < this._aConditionChangeListeners.length; i++) {
			this._aConditionChangeListeners[i](oConditionChange);
		}
	}

	_updateAllRooms() {
		var sName, mRooms;

		mRooms = this.getRooms();
		for (sName in mRooms) {
			if (mRooms.hasOwnProperty(sName)) {
				this._updateSingleRoom(mRooms[sName]);
			}
		}
	}

	_updateSingleRoom(oRoom) {
		if (oRoom._oUpdateTimeout) {
			clearTimeout(oRoom._oUpdateTimeout);
		}
		oRoom._oUpdateTimeout = setTimeout(function() {
			oRoom._oUpdateTimeout = null;
			oRoom.updateLight();
		}, 0);
	}

	attachSensorChange(callback) {
		this._aSensorChangeListeners.push(callback);
	}

	detachSensorChange(callback) {
		var idx;
		idx = this._aSensorChangeListeners.indexOf(callback);
		if (idx > -1) {
			this._aSensorChangeListeners.splice(idx, 1);
		}
	}

	attachConditionChange(callback) {
		this._aConditionChangeListeners.push(callback);
	}

	detachConditionChange(callback) {
		var idx;
		idx = this._aConditionChangeListeners.indexOf(callback);
		if (idx > -1) {
			this._aConditionChangeListeners.splice(idx, 1);
		}
	}

	getSensor() {
		return this._oSiteRoom.getSensor.apply(this._oSiteRoom, arguments);
	}

	getHueWrapper() {
		return this._oHueWrapper;
	}
}

module.exports = Site;
