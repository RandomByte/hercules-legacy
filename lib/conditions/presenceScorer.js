var debug = require("debug")("hercules:presenceScorer"),
	Condition = require("./condition.js");

/* Scoring system:
	Input                                       | Points
	------------------------------------------- | -----
	Any movement                                | 10
	Movement does not stop within 30 seconds    | 20
	Movement in another room within 30 seconds  | 20
	Time matches typical home type              | 20
	=========================================== | ====
	Threshold                                   | 50
*/

/* oParams:
	oParent
*/
function PresenceScorer(oParams) {
	Condition.apply(this, arguments);

	/* _oConditions.mRooms will look like this:
		{
			hallway: {
				iLastMovement: 1474320920796
			}
		}
	*/
	this._oConditions = {
		mRooms: {}
	};

	this._iScore = 0;

	this.getParent().attachSensorChange(this._handleSensorChange.bind(this));
}

PresenceScorer.prototype = Object.create(Condition.prototype);
PresenceScorer.prototype.constructor = Condition;

PresenceScorer.prototype.getScore = function() {
	return this._iScore;
};
PresenceScorer.prototype.getLogValue = PresenceScorer.prototype.getScore;

PresenceScorer.prototype._handleSensorChange = function(oStateChange) {
	var sRoom, oSensor;

	oSensor = oStateChange.oSource;

	if (oSensor.getName() === "Motion") { // For now, we are only interested in motion
		sRoom = oSensor.getParent().getName();

		this._updateRoom(sRoom, oSensor.getValue());
	}
};

PresenceScorer.prototype._updateRoom = function(sName, bMotion) {
	var oRoom;

	oRoom = this._oConditions.mRooms[sName];

	if (!oRoom) {
		oRoom = {
			bMotion: false,
			iLastMovement: 0,
			bConfirmedMovement: false // means movement didn't stop within 30 seconds
		};
		this._oConditions.mRooms[sName] = oRoom;
	}

	oRoom.bMotion = bMotion;

	if (bMotion) {
		oRoom.iLastMovement = new Date();
		if (!oRoom._iConfirmedMovementTimeout) {
			oRoom._iConfirmedMovementTimeout = setTimeout(function() {
				oRoom._iConfirmedMovementTimeout = null;

				if (oRoom.bMotion) {
					// After 30 seconds: still movement -> confirm movement
					oRoom.bConfirmedMovement = true;
					this._updateScore();
				}
			}.bind(this), 30000);
		}
	}
	this._updateScore();
};

PresenceScorer.prototype._updateScore = function() {
	this._calculateScore();
	this._handleConditionChange();

	if (this.getScore() < 3) {
		if (!this._iResetScoreTimeout) {
			this._iResetScoreTimeout = setTimeout(function() {
				this._iResetScoreTimeout = null;

				this._resetScore();
			}.bind(this), 60000);
		}
	} else if (this._iResetScoreTimeout) {
		clearTimeout(this._iResetScoreTimeout);
	}
};

PresenceScorer.prototype._calculateScore = function() {
	var iScore, iSmplScore, sRoom, oRoom;

	iScore = 0;

	debug("Calculating score...");
	for (sRoom in this._oConditions.mRooms) {
		if (this._oConditions.mRooms.hasOwnProperty(sRoom)) {
			oRoom = this._oConditions.mRooms[sRoom];
			debug("Scoring room %s", sRoom);

			if (oRoom.iLastMovement) { // any movement
				iScore += 10;
				debug("Any movement detected: +10 => %s", iScore);
			}

			if (oRoom.bConfirmedMovement) {
				iScore += 20;
				debug("Confirmed movement: +20 => %s", iScore);
			}
		}
	}

	// Simplify score
	if (iScore < 10) {
		iSmplScore = 0; // nothing
	} else if (iScore >= 10 && iScore < 20) {
		iSmplScore = 1; // might be initial movement (nothing confirmed yet)
	} else if (iScore >= 20 && iScore < 50) {
		iSmplScore = 2; // confirmed in one room or unconfirmed in two - only in rare circumstances a false-positive
	} else { // everything above 50
		iSmplScore = 3; // definitely confirmed presence
	}

	this._iScore = iSmplScore;
	debug("==== Reached score of %s (%s) ====", iSmplScore, iScore);
};

PresenceScorer.prototype._resetScore = function() {
	var sRoom, oRoom;

	for (sRoom in this._oConditions.mRooms) {
		if (this._oConditions.mRooms.hasOwnProperty(sRoom)) {
			oRoom = this._oConditions.mRooms[sRoom];

			if (oRoom._iConfirmedMovementTimeout) {
				clearTimeout(oRoom._iConfirmedMovementTimeout);
			}
			oRoom = null;
		}
	}
	this._oConditions = {
		mRooms: {}
	};
};

module.exports = PresenceScorer;