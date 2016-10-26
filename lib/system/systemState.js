
class SystemState {
	constructor() {
		this._aStateChangeListeners = [];

		this.oSystemState = {
			bProcessSensorInput: true
		};
	}

	getState() {
		return this.oSystemState;
	}

	getProcessSensorInput() {
		return this.oSystemState.bProcessSensorInput;
	}

	setProcessSensorInput(bProcessSensorInput) {
		this._changeState("bProcessSensorInput", bProcessSensorInput);
	}

	_changeState(sProp, bNewVal) {
		if (this.oSystemState[sProp] !== bNewVal) {
			console.log("System state changed:", sProp, "=>", bNewVal);
			this.oSystemState[sProp] = bNewVal;

			let i;
			for (i = this._aStateChangeListeners.length - 1; i >= 0; i--) {
				this._aStateChangeListeners[i](this.oSystemState);
			}
		}
	}

	attachStateChange(callback) {
		this._aStateChangeListeners.push(callback);
	}

	detachStateChange(callback) {
		var idx;
		idx = this._aStateChangeListeners.indexOf(callback);
		if (idx > -1) {
			this._aStateChangeListeners.splice(idx, 1);
		}
	}
}

module.exports = SystemState;
