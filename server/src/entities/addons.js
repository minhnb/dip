'use strict';

function convertAddon(addon) {
	return {
		id: addon._id,
		name: addon.name,
		details: addon.details,
		price: addon.price
	};
}
module.exports = convertAddon;