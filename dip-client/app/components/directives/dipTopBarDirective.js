dipApp.directive('dipTopBar', ['userService', function (userService) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/top-bar.html';
        },
        link: function ($scope, element, attrs) {
            $scope.logOut = function () {
                userService.logOut()
                    .success(function (data, status) {
                        $scope.$parent.isInitTemplate = false;
                        $scope.goToPath('/login');
                    })
                    .error(function (data, status) {

                    });
            };
        }
    };
}]);