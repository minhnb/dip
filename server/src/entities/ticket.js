'use strict';

function convertTicket(ticket, pool) {
    if (pool) {
        let _ticket = pool.tickets.id(ticket._id);
        if (_ticket) {
            ticket = _ticket;
        }
    }

    var obj = {
        id: ticket._id
    };
    if (ticket.price) {
        obj.price = ticket.price;
    }
    return obj;
}

module.exports = convertTicket;