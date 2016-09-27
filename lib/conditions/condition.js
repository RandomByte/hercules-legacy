
/* oParams:
	sName
	oParent
*/
class Condition {
	constructor(oParams) {
		this._sName = oParams.sName;
		this._oParent = oParams.oParent;
	}

	getName() {
		return this._sName;
	}

	getParent() {
		return this._oParent;
	}

	getLogValue() {
		return "<Not implemented>";
	}

	_handleConditionChange() {
		this.getParent().handleConditionChange({
			oSource: this
		});
	}
}

module.exports = Condition;
