var fs = require("fs"),
	jsonfile = require("jsonfile"),
	huejay = require("huejay");

/* oParams:
	sHueConfigPath
*/
class Hue {
	constructor(oParams) {
		this._sHueConfigPath = oParams.sHueConfigPath;

		this._ready = this._loadConfig()
			.then(function() {
				return this.connect();
			}.bind(this))
			.then(function() {
				return this.loadGroups();
			}.bind(this));
	}

	getReady() {
		return this._ready;
	}

	_loadConfig() {
		return new Promise(function(resolve, reject) {
			var mUserAttribs, mConfig;
			try {
				fs.statSync(this._sHueConfigPath).isFile();
				mConfig = jsonfile.readFileSync(this._sHueConfigPath);
				if (!mConfig.username || !mConfig.ip) {
					reject("Hue: config data missing. Please remove file " + this._sHueConfigPath + " and try again.");
				} else {
					this.mConfig = mConfig;
					resolve();
				}
			} catch (e) {
				console.log("No Hue config found, attempting to create a new one...");

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
							jsonfile.writeFile(this._sHueConfigPath, mBridgeConfig, function(err) {
								if (err) {
									console.log("Error saving token file at " + this._sHueConfigPath);
									console.log(err);
									process.exit(1);
								} else {
									console.log("Hue config file saved at " + this._sHueConfigPath);
									console.log("Exiting now. Please try again.");
									process.exit(0);
								}
							});
						})
						.catch(function(err) {
							console.log("Error during user creation on Hue bridge:");
							console.log(err);
							reject("Initial setup of Hue bridge connection failed.");
						});
				});
			}
		}.bind(this));
	}

	connect() {
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
	}

	loadGroups() {
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
	}

	getGroupByName(sName) {
		return this.mGroups[sName];
	}

	getClient() {
		return this.oClient;
	}
};

module.exports = Hue;
