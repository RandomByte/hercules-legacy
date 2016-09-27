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
class PresenceScorer extends Condition {
	constructor(oParams) {
		super(oParams);

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

	getScore() {
		return this._iScore;
	}

	getLogValue() {
		this.getScore();
	}

	_handleSensorChange(oStateChange) {
		var sRoom, oSensor;

		oSensor = oStateChange.oSource;

		if (oSensor.getName() === "Motion") { // For now, we are only interested in motion
			sRoom = oSensor.getParent().getName();

			this._updateRoom(sRoom, oSensor.getValue());
		}
	}

	_updateRoom(sName, bMotion) {
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
	}

	_updateScore() {
		this._calculateScore();
		this._handleConditionChange();

		if (this.getScore() < 3) {
			if (!this._iOneMinuteResetScoreTimeout) {
				this._iOneMinuteResetScoreTimeout = setTimeout(function() {
					debug("Resetting score: Didn't reach threshold within one minute");
					this._iOneMinuteResetScoreTimeout = null;

					this._resetScore();
				}.bind(this), 60000);
			}
		} else if (this._iOneMinuteResetScoreTimeout) {
			clearTimeout(this._iOneMinuteResetScoreTimeout);

			// TODO: Define trigger for resetting score (e.g. leaving the house)
			if (!this._iTriggerResetScoreTimeout) {
				this._iTriggerResetScoreTimeout = setTimeout(function() {
					debug("Resetting score: <TBD trigger> - one hour passed");
					this._iTriggerResetScoreTimeout = null;

					this._resetScore();
				}.bind(this), 3600000);
			}
		}
	}

	_calculateScore() {
		var iPoints, iScore, sRoom, oRoom;

		iPoints = 0;

		debug("Calculating score...");
		for (sRoom in this._oConditions.mRooms) {
			if (this._oConditions.mRooms.hasOwnProperty(sRoom)) {
				oRoom = this._oConditions.mRooms[sRoom];
				debug("Scoring room %s", sRoom);

				if (oRoom.iLastMovement) { // any movement
					iPoints += 10;
					debug("Any movement detected: +10 => %s", iPoints);
				}

				if (oRoom.bConfirmedMovement) {
					iPoints += 20;
					debug("Confirmed movement: +20 => %s", iPoints);
				}
			}
		}

		// Transform points to a score
		if (iPoints < 10) {
			iScore = 0; // nothing
		} else if (iPoints >= 10 && iPoints < 20) {
			iScore = 1; // might be initial movement (nothing confirmed yet)
		} else if (iPoints >= 20 && iPoints < 50) {
			iScore = 2; // confirmed in one room or unconfirmed in two - only in rare circumstances a false-positive
		} else { // everything above 50
			iScore = 3; // definitely confirmed presence
		}

		this._iScore = iScore;
		debug("==== Reached score of %s (%s points) ====", iScore, iPoints);
	}

	_resetScore() {
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

		this._iScore = 0;
	}
}

module.exports = PresenceScorer;
