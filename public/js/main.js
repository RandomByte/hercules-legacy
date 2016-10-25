
hercules = {};

hercules.App = class {
	constructor() {
		this.oStatus = {};
		this.oUtil = new hercules.Util();

		this._registerButtonHandlers();
	}

	_registerButtonHandlers() {
		var that = this;

		jQuery("#overall-status-toggle-button").click(function() {
			var oButton = jQuery(this);
			oButton.prop("disabled", true);
			oButton.text("Loading...");
			that.toggleStatus({
				bHandleSensorInput: !that.oStatus.bHandleSensorInput
			}, function() {
				oButton.prop("disabled", false);
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
		jQuery("#overall-status-card").removeClass("card-danger");
		jQuery("#overall-status-toggle-button").removeClass("btn-warning");
		jQuery("#overall-status-toggle-button").prop("disabled", false);
		if (this.oStatus.sError) {
			jQuery("#overall-status-text").text("Error: " + this.oStatus.sError);
			jQuery("#overall-status-toggle-button").text("???");

			jQuery("#overall-status-toggle-button").removeClass("btn-success");
			jQuery("#overall-status-toggle-button").removeClass("btn-danger");
			jQuery("#overall-status-toggle-button").addClass("btn-warning");

			jQuery("#overall-status-card").removeClass("card-warning");
			jQuery("#overall-status-card").removeClass("card-success");
			jQuery("#overall-status-card").addClass("card-danger");
		} else if (this.oStatus.bHandleSensorInput) {
			jQuery("#overall-status-text").text("All systems up and running");
			jQuery("#overall-status-toggle-button").text("Stop");

			jQuery("#overall-status-toggle-button").removeClass("btn-success");
			jQuery("#overall-status-toggle-button").addClass("btn-danger");

			jQuery("#overall-status-card").removeClass("card-warning");
			jQuery("#overall-status-card").addClass("card-success");
		} else {
			jQuery("#overall-status-text").text("Systems stopped");
			jQuery("#overall-status-toggle-button").text("Start");

			jQuery("#overall-status-toggle-button").removeClass("btn-danger");
			jQuery("#overall-status-toggle-button").addClass("btn-success");

			jQuery("#overall-status-card").removeClass("card-success");
			jQuery("#overall-status-card").addClass("card-warning");
		}
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
