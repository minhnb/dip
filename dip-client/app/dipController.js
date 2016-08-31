dipApp.controller('DIPController', ['$scope', '$timeout', '$rootScope', '$location', '$route', '$translate', 'usSpinnerService', 'userService', 'userUtils',
    function ($scope, $timeout, $rootScope, $location, $route, $translate, usSpinnerService, userService, userUtils) {
        $scope.showNgView = false;
        $rootScope.isNoMenuPage = false;
        $scope.isInitTemplate = false;
        $scope.currentUser = {};

        $scope.ROLE_ADMIN = ROLE_ADMIN;
        $scope.ROLE_PARTNER = ROLE_PARTNER;
        $scope.ROLE_USER = ROLE_USER;

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
            var message = error.details;
            if (!message) {
                message = status;
            }
            utils.notyErrorMessage(message, true);
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
            if (userService.user && userService.user.info) {
                $scope.currentUser = userUtils.convertUser(userService.user.info);
            }
            if (!userService.user.JWT) {
                return Promise.resolve();
            }
            return userService.getUserInfo()
                .success(function (data, status) {
                    var convertedUser = userUtils.convertUser(data.user);
                    utils.updateObjectInfo($scope.currentUser, convertedUser);
                })
                .error(function (data, status) {
                    $scope.handleError(data);
                });
        };

        $scope.userHasRole = function (roles) {
            return roles.indexOf($scope.currentUser.role) > -1;
        };

        $scope.getDipWebsiteRole = function () {
            return config.ROLE;
        };

        $scope.getPageTitle = function () {
            var prefix = $scope.translate(userUtils.getUserRole(config.ROLE));
            var suffix = $scope.translate($rootScope.pageTitle);
            var pageTitle = [prefix, suffix];
            return pageTitle.filter(Boolean).join(' | ');
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
                console.log('init template');
            }
        };

        $scope.initUser();
        setTimeout(function () {
            $scope.initTemplate();
        }, 1000);
    }]);