
hercules = {};

hercules.App = class {
	constructor() {
		this.oUtil = new hercules.Util();
	}

	updateStatus() {
		this.oUtil.get("status", function(oData) {
			if (oData.bRunning) {
				jQuery("#overall-status-text").text("Hercules is up and running");
			} else {
				jQuery("#overall-status-text").text("Hercules is stopped");
			}
		}, function(sError) {
			console.log(sError);
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
};

jQuery(document).ready(function() {
	var oApp;
	oApp = new hercules.App();
	oApp.updateStatus();
});
