dipApp.controller('DIPController', ['$scope', '$timeout', '$rootScope', '$location', 'userService',
    function ($scope, $timeout, $rootScope, $location, userService) {
        $rootScope.isNoMenuPage = true;
        $rootScope.goToPath = function (path) {
            $location.path(path);
        }
    }]);