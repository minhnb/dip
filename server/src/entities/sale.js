'use strict';

function convertSale(sale) {
    return {
        id: sale._id,
        rawData: sale
    }
}

module.exports = convertSale;