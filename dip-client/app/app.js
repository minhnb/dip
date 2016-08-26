'use strict';

// Declare app level module which depends on views, and components
var dipApp = angular.module('dipApp', [
    'ngRoute', 'ngStorage', 'angularSpinner', 'pascalprecht.translate',
    'dipApp.login',
    'dipApp.signup',
    'dipApp.dashboard',
    'dipApp.report_users',
    'dipApp.report_event_reservations',
    'dipApp.report_hotel_reservations',
    'dipApp.settings',
    'dipApp.properties_hotels',
    'dipApp.properties_hotel',
    'dipApp.version'
]).config(['$locationProvider', '$routeProvider', '$httpProvider', '$translateProvider',
    function ($locationProvider, $routeProvider, $httpProvider, $translateProvider) {
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.interceptors.push('authInterceptor');
        // $locationProvider.hashPrefix('!');

        $routeProvider.otherwise({redirectTo: '/dashboard'});

        // $locationProvider.html5Mode({
        //     enabled: true,
        //     requireBase: false
        // });

        $translateProvider.translations('en', angular_translate_en);
        $translateProvider.preferredLanguage('en');
}]);


dipApp.factory('authInterceptor', function ($rootScope, $q, $localStorage, $location) {
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
            return response || $q.when(response);
        },
        responseError: function (response) {
            console.log(response);
            if (response.status === 401) {
                // handle the case where the user is not authenticated
                $localStorage.$reset();
                $location.path('/login');
            }
            return $q.reject(response);
        }
    };
});

dipApp.run(['$rootScope', '$location', '$localStorage', function ($rootScope, $location, $localStorage) {
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        if ($localStorage.user && $localStorage.user.JWT) {

        } else {
            var noTokenPages = ['/signup', '/login'];
            if (noTokenPages.indexOf(next.originalPath) == -1) {
                $location.path('/login');
            }
        }
    });
}]);