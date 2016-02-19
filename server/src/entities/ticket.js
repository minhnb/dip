'use strict';

function convertTicket(ticket) {
    return {
        id: ticket._id,
        price: ticket.price,
        description: ticket.description
    }
}

module.exports = convertTicket;