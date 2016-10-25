
class SystemState {
	constructor() {
		this.oSystemState = {
			bHandleSensorInput: true
		};
	}

	getHandleSensorInput() {
		return this.oSystemState.bHandleSensorInput;
	}

	setHandleSensorInput(bHandleSensorInput) {
		this._changeState("bHandleSensorInput", bHandleSensorInput);
	}

	_changeState(sProp, bNewVal) {
		if (this.oSystemState[sProp] !== bNewVal) {
			console.log("System state changed:", sProp, "=>", bNewVal);
			this.oSystemState[sProp] = bNewVal;
		}
	}

}

module.exports = SystemState;
