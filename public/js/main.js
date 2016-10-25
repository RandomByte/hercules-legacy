
hercules = {};

hercules.App = class {
	constructor() {
		this.oStatus = {};
		this.oUtil = new hercules.Util();

		this._registerButtonHandlers();
	}

	_registerButtonHandlers() {
		var that = this;

		jQuery("#stateTable tr").each(function() { // Loop over all rows
			// Register to buttons of rows generically
			jQuery(this).find(".hercules-state-toggle-button").click(this.id, function(oEvent) {
				var oStatusChange,
					oButton = jQuery(this);

				oButton.prop("disabled", true);
				oButton.addClass("active");

				oStatusChange = {};
				oStatusChange[oEvent.data] = !that.oStatus[oEvent.data];
				that.toggleStatus(oStatusChange, function() {
					oButton.prop("disabled", false);
					oButton.removeClass("active");
				});
			});
		});
	}

	toggleStatus(oStatusDelta, callback) {
		this.oUtil.post("status", oStatusDelta,
			function(oData) {
				if (callback) {
					callback();
				}
				this.oStatus = oData;
				this._updateStatus();
			}.bind(this), function(sError) {
				console.error("Toggle Status Error:", sError);
				if (callback) {
					callback();
				}
				this.oStatus.sError = sError;
				this._updateStatus();
			}.bind(this));
	}

	updateStatus() {
		this.oUtil.get("status", function(oData) {
			this.oStatus = oData;
			this._updateStatus();
		}.bind(this), function(sError) {
			console.error("Update Status Error:", sError);
		});
	}

	_updateStatus() {
		var that = this;
		jQuery("#stateTable tr").each(function() {
			var vStatus;
			vStatus = that.oStatus[this.id];
			jQuery(this).find(".hercules-state-text").text(vStatus);

			if (this.id.charAt(0) === "b") {
				// Special boolean handling
				if (vStatus === true) {
					jQuery(this).removeClass("table-danger");
					jQuery(this).addClass("table-success");
				} else {
					jQuery(this).removeClass("table-success");
					jQuery(this).addClass("table-danger");
				}
			}
		});
	}
};

hercules.Util = class {
	get(sPath, success, error) {
		jQuery.ajax({
			method: "GET",
			url: "/api/" + sPath,
			dataType: "json",
			cache: false,
			success: function(oData) {
				success(oData);
			},
			error: function(oReq, sStatus, sError) {
				if (error) {
					error(sError);
				} else {
					console.log(sError);
				}
			}
		});
	}

	post(sPath, oData, success, error) {
		jQuery.ajax({
			method: "POST",
			url: "/api/" + sPath,
			dataType: "json",
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify(oData),
			success: function(oData) {
				success(oData);
			},
			error: function(oReq, sStatus, sError) {
				if (error) {
					error(sError);
				} else {
					console.log(sError);
				}
			}
		});
	}
};

jQuery(document).ready(function() {
	var oApp;
	oApp = new hercules.App();
	oApp.updateStatus();
});
