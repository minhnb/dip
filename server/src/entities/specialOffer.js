'use strict';

function convertSpecialOffer(sOffer) {
	return {
		id: sOffer._id,
		name: sOffer.name,
		details: sOffer.details,
		price: sOffer.price
	};
}
module.exports = convertSpecialOffer;