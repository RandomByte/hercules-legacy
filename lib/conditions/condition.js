
/* oParams:
	sName
	oParent
*/
function Condition(oParams) {
	this._sName = oParams.sName;
	this._oParent = oParams.oParent;
}

Condition.prototype = {
	getName: function() {
		return this._sName;
	},

	getParent: function() {
		return this._oParent;
	},

	_handleConditionChange: function() {
		this.getParent().handleConditionChange({
			oSource: this
		});
	}
};

module.exports = Condition;
