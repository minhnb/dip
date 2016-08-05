dipApp.controller('DIPController', ['$scope', '$timeout', '$rootScope', '$location', '$translate', 'usSpinnerService', 'userService',
    function ($scope, $timeout, $rootScope, $location, $translate, usSpinnerService, userService) {
        $rootScope.isNoMenuPage = false;
        $scope.isInitTemplate = false;
        $rootScope.goToPath = function (path) {
            $location.path(path);
        };
        $scope.okText = "OK";
        $scope.cancelText = "CANCEL";

        $scope.startSpin = function(){
            if ($rootScope.isNoMenuPage) {

            } else {

            }
            usSpinnerService.spin('dip-spinner');
        };

        $scope.stopSpin = function(){
            usSpinnerService.stop('dip-spinner');
        };

        $scope.changeLanguage = function (key) {
            $translate.use(key);
        };

        $scope.translate = function (translationId, interpolateParams, interpolationId) {
            return $translate.instant(translationId, interpolateParams, interpolationId);
        };

        $scope.handleError = function (error) {
            $scope.stopSpin();
            utils.notyErrorMessage(error.details, true);
        };

        $rootScope.initDipApp = function (fn) {
            $scope.startSpin();
            $rootScope.isInit = false;
            setTimeout(function () {
                if (!$rootScope.isInit) {
                    $rootScope.isInit = true;
                    fn();
                }
            }, 1000);
        };

        $scope.initTemplate = function () {
            $scope.okText = $scope.translate($scope.okText);
            $scope.cancelText = $scope.translate($scope.cancelText);

            if (!$rootScope.isNoMenuPage && !$scope.isInitTemplate) {
                $scope.isInitTemplate = true;
                utils.load_script('adminLTE/dist/js/app.js');
                // console.log('init template');
            }
        };
        setTimeout(function () {
            $scope.initTemplate();
        }, 1000);
    }]);