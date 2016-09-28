'use strict';

angular.module('dipApp.properties_calendar', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/properties/calendar', {
            templateUrl: '/properties/calendar/calendar.html',
            controller: 'HotelProfileController'
        });
    }]);