'use strict';

function convertTicket(ticket) {
    if (!ticket) return null;
    return {
        id: ticket._id,
        price: ticket.price,
        description: ticket.description
    };
}

module.exports = convertTicket;