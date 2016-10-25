
class SystemState {
	constructor() {
		this.oSystemState = {
			bProcessSensorInput: true
		};
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
		}
	}

}

module.exports = SystemState;
