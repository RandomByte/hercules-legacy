var express = require("express");

/* oParams:
	iHttpPort
	oParent
*/
class RestServer {
	constructor(oParams) {
		this._initExpress(oParams.iHttpPort);
	}

	_initExpress(iHttpPort) {
		var app = express();

		app.use(express.static("public"));

		app.get("/api/status", function(req, res) {
			res.send({
				bRunning: true
			});
		});

		app.listen(iHttpPort, function() {
			console.log("HTTP server listening on " + iHttpPort);
		});
	}
}

module.exports = RestServer;
