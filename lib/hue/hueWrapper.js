var Hue = require("./hue.js");

function HueWrapper() {
	this.oHue = new Hue();
	this.mHandledLights = {};
	this.mHandledGroups = {};
}

HueWrapper.prototype = {
	getReady: function() {
		return this.oHue.getReady();
	},

	handleGroup: function(sRoom, bOn) {
		var iGroupId, oGroup,
			that = this;

		// Get group ID for room
		oGroup = this.oHue.getGroupByName(sRoom);
		iGroupId = oGroup.sId;

		// Load group to
		//	a) check if we are allowed to handle it
		//	b) change it's properties to save them back
		return this.oHue.getClient().groups.getById(iGroupId).then(function(oGroup) {
			var iLightId, oMetaGroup, i;

			oMetaGroup = that.mHandledGroups[iGroupId];

			if (oMetaGroup && oMetaGroup.oOffTimeout) {
				// Clear any existing off-timeout first
				clearTimeout(oMetaGroup.oOffTimeout);
				oMetaGroup.oOffTimeout = null;
			}

			if (oGroup.anyOn && !oMetaGroup) {
				// We won't handle this group
				// -> fallback to lights
				for (i = oGroup.lightIds.length - 1; i >= 0; i--) {
					iLightId = oGroup.lightIds[i];
					that.handleLight(iLightId, bOn);
				}
				return;
			} else if (oMetaGroup && ((bOn && oGroup.allOn) || (!bOn && !oGroup.allOn))) {
				// We handle it and it's already on or off
				// -> nothing to do
				// If we wouldn't handle it, we might want to set our color
				return;
			}

			if (!oMetaGroup) {
				oMetaGroup = that.mHandledGroups[iGroupId] = {};
			}

			oGroup.on = bOn;
			if (bOn) {
				console.log("Turning on group " + oGroup.name);
				oGroup.brightness = 184;
				oGroup.hue = 8411;
				oGroup.saturation = 140;
				return that.oHue.getClient().groups.save(oGroup);
			}
			oMetaGroup.oOffTimeout = setTimeout(function() {
				console.log("Turning off group " + oGroup.name);
				that.oHue.getClient().groups.save(oGroup);
				that.mHandledGroups[iGroupId] = null;
			}, 5000);
		})
		.catch(function(err) {
			console.log(err);
			console.log("Failed to update group");
		});
	},

	handleLight: function(iLightId, bOn) {
		var that = this;
		// Load light to
		//	a) check if we are allowed to handle it
		//	b) change it's properties to save them back
		return this.oHue.getClient().lights.getById(iLightId).then(function(oLight) {
			var oMetaLight;

			oMetaLight = that.mHandledLights[iLightId];

			if (oMetaLight && oMetaLight.oOffTimeout) {
				// Clear any existing off-timeout first
				clearTimeout(oMetaLight.oOffTimeout);
				oMetaLight.oOffTimeout = null;
			}

			if (oLight.on && !oMetaLight) {
				// We won't handle this light
				return;
			} else if (oMetaLight && ((bOn && oLight.on) || (!bOn && !oLight.on))) {
				// We handle it and it's already on or off
				// -> nothing to do
				// If we wouldn't handle it, we might want to set our color
				return;
			}

			if (!oMetaLight) {
				oMetaLight = that.mHandledLights[iLightId] = {};
			}

			oLight.on = bOn;
			if (bOn) {
				console.log("Turning on light " + oLight.name);
				oLight.brightness = 184;
				oLight.hue = 8411;
				oLight.saturation = 140;
				return that.oHue.getClient().lights.save(oLight);
			}
			oMetaLight.oOffTimeout = setTimeout(function() {
				console.log("Turning off light " + oLight.name);
				that.oHue.getClient().lights.save(oLight);
				that.mHandledLights[iLightId] = null;
			}, 5000);
		})
		.catch(function(err) {
			console.log(err);
			console.log("Failed to update light");
		});
	}
};

module.exports = HueWrapper;
