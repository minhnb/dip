'use strict';

angular.module('dipApp.settings', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/settings', {
            templateUrl: 'settings/settings.html',
            controller: 'SettingsController'
        });
    }])
    .controller('SettingsController', ['$scope', '$timeout', '$rootScope', '$location', 'adminService',
        function ($scope, $timeout, $rootScope, $location, adminService) {
            $rootScope.isNoMenuPage = false;
            $rootScope.pageTitle = "Settings";
            
            $scope.updateAppContext = function () {
                adminService.updateAppContext()
                    .success(function (data, status) {
                        notySuccessMessage('Updated app context successfully!');
                    })
                    .error(function (data, status) {
                        notyErrorMessage('Updated app context failed!');
                    });
            }
        }]);