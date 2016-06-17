'use strict';

function convertCity(city) {
    if (!city) {
        return null;
    }
    return {
        city: city.city,
        state: city.state
    };
}

module.exports = convertCity;