'use strict';

function convertSpecialOffer(sOffer) {
	let base = sOffer.map(s => {
		return {
			id: s.type._id,
			name: s.type.name,
			details: s.type.details,
			count: s.type.count,
			price: s.price
		}
	})
	return base;
}
module.exports = convertSpecialOffer;