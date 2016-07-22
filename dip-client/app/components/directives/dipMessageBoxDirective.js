dipApp.directive('dipMessageBox', ['userService', function (userService) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/log-out-message-box.html';
        },
        link: function ($scope, element, attrs) {
            $scope.logOut = function () {
                userService.logOut()
                    .success(function (data, status) {
                        $scope.goToPath('/login');
                    })
                    .error(function (data, status) {

                    });
            };
        }
    };
}]);