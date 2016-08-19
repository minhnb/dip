'use strict';

describe('dipApp.hotel_reservations module', function() {

    beforeEach(module('dipApp.report_hotel_reservations'));

    describe('hotel_reservations controller', function(){

        it('should ....', inject(function($controller) {
            //spec body
            var view1Ctrl = $controller('ReportHotelReservationsController');
            expect(view1Ctrl).toBeDefined();
        }));

    });
});