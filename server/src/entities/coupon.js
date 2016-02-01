'use strict';

function convertCoupon(coupon) {
    return {
        id: coupon._id,
        code: coupon.code,
        percentOff: coupon.percentOff
    };
}

module.exports = convertCoupon;