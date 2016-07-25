'use strict';

// Declare app level module which depends on views, and components
var dipApp = angular.module('dipApp', [
    'ngRoute', 'ngStorage',
    'dipApp.login',
    'dipApp.dashboard',
    'dipApp.report_users',
    'dipApp.report_event_reservations',
    'dipApp.report_hotel_reservations',
    'dipApp.settings',
    'dipApp.version'
]).config(['$locationProvider', '$routeProvider', '$httpProvider',
    function ($locationProvider, $routeProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.interceptors.push('authInterceptor');
    // $locationProvider.hashPrefix('!');

    $routeProvider.otherwise({redirectTo: '/dashboard'});

    // $locationProvider.html5Mode({
    //     enabled: true,
    //     requireBase: false
    // });
}]);


dipApp.factory('authInterceptor', function ($rootScope, $q, $localStorage) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if ($localStorage.user && $localStorage.user.JWT) {
                config.headers.Authorization = $localStorage.user.JWT;
            }
            config.headers.jsonerror = true;
            return config;
        },
        response: function (response) {
            if (response.status === 401) {
                // handle the case where the user is not authenticated
            }
            return response || $q.when(response);
        }
    };
});

dipApp.run(['$rootScope', '$location', '$localStorage', function ($rootScope, $location, $localStorage) {
    $rootScope.$on('$routeChangeStart', function (event) {
        if ($localStorage.user && $localStorage.user.JWT) {

        } else {
            $location.path('/login');
        }
    });
}]);