var express = require("express"),
	bodyParser = require("body-parser"),
	WebSocket = require("socket.io");

/* oParams:
	oSystemState
*/
class RestServer {
	constructor(oParams) {
		this.oSystemState = oParams.oSystemState;
		this.oSystemState.attachStateChange(this._handleSystemStateChange.bind(this));
	}

	init(iHttpPort) {
		this._initExpress(iHttpPort);
	}

	_initExpress(iHttpPort) {
		var app = express(),
			oServer,
			that = this;

		app.use(express.static("public"));
		app.use(bodyParser.json());

		app.get("/api/status", function(req, res) {
			res.send(that.oSystemState.getState());
		});

		app.post("/api/status", function(req, res) {
			if (req.body.bProcessSensorInput !== undefined) {
				that.oSystemState.setProcessSensorInput(req.body.bProcessSensorInput);
			}
			res.send(that.oSystemState.getState());
		});

		oServer = app.listen(iHttpPort, function() {
			console.log("HTTP server listening on " + iHttpPort);
		});

		this.oWebSocket = new WebSocket(oServer);
	}

	_handleSystemStateChange(oSystemState) {
		this.oWebSocket.emit("statusChange", oSystemState);
	}
}

module.exports = RestServer;
