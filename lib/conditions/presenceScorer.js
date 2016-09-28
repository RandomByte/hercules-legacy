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
		return this.getScore();
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
			if (!oRoom._oConfirmedMovementTimeout) {
				oRoom._oConfirmedMovementTimeout = setTimeout(function() {
					oRoom._oConfirmedMovementTimeout = null;

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
		/* As long as there is sensor input, the scores will continue to be calculated all the time.
			Thus, they will rise and fall all time time.
		*/
		var iScore;

		iScore = this._calculateScore();

		if (this._iScore >= 3 && iScore >= 3) {
			// Confirmed score is still confirmed => do nothing
		} else if (this._iScore >= 3 && iScore < 3) {
			// Score has fallen from confirmed to unconfirmed, give it an hour until reset
			if (this._oWaitForReConfirmationTimeout) {
				clearTimeout(this._oWaitForReConfirmationTimeout);
			}
			this._oWaitForReConfirmationTimeout = setTimeout(function() {
				debug("Resetting score: Score didnÄt exceed threshold for a full hour");
				this._resetScore();
			}.bind(this), 3600000);
		} else {
			if (iScore < 3 && !this._oWaitForConfirmationTimeout) {
				this._oWaitForConfirmationTimeout = setTimeout(function() {
					debug("Resetting score: Didn't reach threshold within one minute");
					this._oWaitForConfirmationTimeout = null;

					this._resetScore();
				}.bind(this), 60000);
			}

			if (this._iScore !== iScore) {
				this._iScore = iScore;
				this._handleConditionChange();
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

				if (oRoom.iLastMovement) { // any movement
					iPoints += 10;
					debug("[%s]: Any movement detected: +10 => %s", sRoom, iPoints);
				}

				if (oRoom.bConfirmedMovement) {
					iPoints += 20;
					debug("[%s]: Confirmed movement: +20 => %s", sRoom, iPoints);
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

		debug("==== Reached score of %s (%s points) ====", iScore, iPoints);
		return iScore;
	}

	_resetScore() {
		var sRoom, oRoom;

		for (sRoom in this._oConditions.mRooms) {
			if (this._oConditions.mRooms.hasOwnProperty(sRoom)) {
				oRoom = this._oConditions.mRooms[sRoom];

				if (oRoom._oConfirmedMovementTimeout) {
					clearTimeout(oRoom._oConfirmedMovementTimeout);
				}
				oRoom = null;
			}
		}
		this._oConditions = {
			mRooms: {}
		};

		this._updateScore();
	}
}

module.exports = PresenceScorer;
