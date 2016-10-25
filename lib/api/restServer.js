var express = require("express"),
	bodyParser = require("body-parser");

/* oParams:
	oSystemState
*/
class RestServer {
	constructor(oParams) {
		this.oSystemState = oParams.oSystemState;
	}

	init(iHttpPort) {
		this._initExpress(iHttpPort);
	}

	_initExpress(iHttpPort) {
		var app = express(),
			that = this;

		app.use(express.static("public"));
		app.use(bodyParser.json());

		app.get("/api/status", function(req, res) {
			res.send(that._getSystemStatus());
		});

		app.post("/api/status", function(req, res) {
			if (req.body.bProcessSensorInput !== undefined) {
				that.oSystemState.setProcessSensorInput(req.body.bProcessSensorInput);
			}
			res.send(that._getSystemStatus());
		});

		app.listen(iHttpPort, function() {
			console.log("HTTP server listening on " + iHttpPort);
		});
	}

	_getSystemStatus() {
		return {
			bProcessSensorInput: this.oSystemState.getProcessSensorInput()
		};
	}
}

module.exports = RestServer;
