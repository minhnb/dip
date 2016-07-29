dipApp.controller('DIPController', ['$scope', '$timeout', '$rootScope', '$location', 'userService',
    function ($scope, $timeout, $rootScope, $location, userService) {
        $rootScope.isNoMenuPage = false;
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

        setTimeout(function () {
            utils.load_script('adminLTE/dist/js/app.js');
        }, 1000);
    }]);