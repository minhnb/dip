dipApp.controller('DIPController', ['$scope', '$timeout', '$rootScope', '$location', 'userService',
    function ($scope, $timeout, $rootScope, $location, userService) {
        $rootScope.isNoMenuPage = false;
        $scope.isInitTemplate = false;
        $rootScope.goToPath = function (path) {
            $location.path(path);
        };

        $rootScope.initDipApp = function (fn) {
            $rootScope.isInit = false;
            setTimeout(function () {
                if (!$rootScope.isInit) {
                    $rootScope.isInit = true;
                    fn();
                }
            }, 1000);
        };

        $scope.initTemplate = function () {
            if (!$rootScope.isNoMenuPage && !$scope.isInitTemplate) {
                $scope.isInitTemplate = true;
                utils.load_script('adminLTE/dist/js/app.js');
                console.log('init template');
            }
        };
        setTimeout(function () {
            $scope.initTemplate();
        }, 1000);
    }]);