dipApp.controller('DIPController', ['$scope', '$timeout', '$rootScope', '$location', 'userService',
    function ($scope, $timeout, $rootScope, $location, userService) {
        $rootScope.isNoMenuPage = false;
        $rootScope.goToPath = function (path) {
            $location.path(path);
        }
    }]);