var fs = require("fs"),
	path = require("path"),
	jsonfile = require("jsonfile"),
	huejay = require("huejay");

function Hue() {
	this._ready = this._loadConfig()
		.then(function() {
			return this.connect();
		}.bind(this))
		.then(function() {
			return this.loadGroups();
		}.bind(this));
}

Hue.prototype = {

	getReady: function() {
		return this._ready;
	},

	_loadConfig: function() {
		return new Promise(function(resolve, reject) {
			var sHueConfigPath, mUserAttribs, mConfig;
			sHueConfigPath = path.join(__dirname, ".hueConfig.json");
			try {
				fs.statSync(sHueConfigPath).isFile();
				mConfig = jsonfile.readFileSync(sHueConfigPath);
				if (!mConfig.username || !mConfig.ip) {
					console.log("Hue: config data missing. Please remove file " + sHueConfigPath + " and try again.");
					reject();
				} else {
					this.mConfig = mConfig;
					resolve();
				}
			} catch (e) {
				console.log("No Hue config found, creating a new one...");

				huejay.discover().then(function(aBridges) {
					var sIp, oClient, oUser, mBridgeConfig;
					console.log("Found " + aBridges.length + " bridges. Choosing the first one...");
					sIp = aBridges[0].ip;
					oClient = new huejay.Client({
						host: sIp
					});
					oUser = new oClient.users.User();
					oUser.deviceType = "hercules";
					oClient.users.create(oUser)
						.then(function(oUser) {
							mUserAttribs = oUser.attributes.attributes;
							mBridgeConfig = {
								ip: sIp,
								username: mUserAttribs.username,
								deviceType: mUserAttribs.deviceType,
								name: mUserAttribs.name
							};
							jsonfile.writeFile(sHueConfigPath, mBridgeConfig, function(err) {
								if (err) {
									console.log(err);
									console.log("Error saving token file at " + sHueConfigPath);
									process.exit(1);
								} else {
									console.log("Hue config file saved at " + sHueConfigPath);
									console.log("Exiting now. Please try again.");
									process.exit(0);
								}
							});
						})
						.catch(function(err) {
							console.log(err);
							reject();
						});
				});
			}
		}.bind(this));
	},

	connect: function() {
		return new Promise(function(resolve, reject) {
			this.oClient = new huejay.Client({
				host: this.mConfig.ip,
				username: this.mConfig.username
			});

			this.oClient.bridge.ping()
				.then(function() {
					console.log("Connected to bridge at " + this.mConfig.ip);

					this.oClient.bridge.isAuthenticated()
						.then(function() {
							console.log("Successfully authenticated to bridge");
							resolve();
						})
						.catch(function(err) {
							console.log(err);
							console.log("Failed to authenticate to bridge");
							reject();
						});
				}.bind(this))
				.catch(function(err) {
					console.log(err);
					console.log("Failed to connect to bridge at " + this.mConfig.ip);
					reject();
				}.bind(this));
		}.bind(this));
	},

	loadGroups: function() {
		return this.oClient.groups.getAll().then(function(aGroups) {
			var oGroup, i;
			this.mGroups = {};
			for (i = 0; i < aGroups.length; i++) {
				oGroup = aGroups[i];
				if (oGroup.type === "Room") {
					this.mGroups[oGroup.name] = {
						sId: oGroup.id,
						aLightIds: oGroup.lightIds
					};
				}
			}
		}.bind(this));
	},

	getGroupByName: function(sName) {
		return this.mGroups[sName];
	},

	getClient: function() {
		return this.oClient;
	}
};

module.exports = Hue;
