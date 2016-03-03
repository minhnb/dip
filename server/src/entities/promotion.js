'use strict';

function convertCoupon(coupon) {
    return {
        id: coupon._id,
        code: coupon.code,
        amount: coupon.amount
    };
}

module.exports = convertCoupon;