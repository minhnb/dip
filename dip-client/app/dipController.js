dipApp.controller('DIPController', ['$scope', '$timeout', '$rootScope', '$location', '$route', '$translate', 'usSpinnerService', 'userService', 'userUtils',
    function ($scope, $timeout, $rootScope, $location, $route, $translate, usSpinnerService, userService, userUtils) {
        $scope.showNgView = false;
        $rootScope.isNoMenuPage = false;
        $scope.isInitTemplate = false;
        $scope.currentUser = {};

        $rootScope.goToPath = function (path) {
            if ($location.$$path == path) {
                $route.reload();
            } else {
                $location.path(path);
            }
        };
        $scope.okText = "OK";
        $scope.cancelText = "CANCEL";

        $scope.startSpin = function () {
            if ($rootScope.isNoMenuPage) {

            } else {

            }
            usSpinnerService.spin('dip-spinner');
        };

        $scope.stopSpin = function () {
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

        $scope.notifyValidateError = function (message, isTranslated) {
            var messageContent = message;
            if (!isTranslated) {
                messageContent = $scope.translate(message);
            }
            utils.notyErrorMessage(messageContent, true);
            return false;
        };

        $scope.initUser = function () {
            userService.initUser();
            $scope.currentUser = userUtils.convertUser(userService.user.info);
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
            $scope.showNgView = true;
            setTimeout(function () {
                $scope.$apply();
            }, 0);
            $scope.okText = $scope.translate($scope.okText);
            $scope.cancelText = $scope.translate($scope.cancelText);

            if (!$rootScope.isNoMenuPage && !$scope.isInitTemplate) {
                $scope.isInitTemplate = true;
                utils.load_script('adminLTE/dist/js/app.js');
                // console.log('init template');
            }
        };

        $scope.initUser();
        setTimeout(function () {
            $scope.initTemplate();
        }, 1000);
    }]);