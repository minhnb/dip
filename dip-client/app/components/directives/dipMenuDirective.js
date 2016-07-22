dipApp.directive('dipMenu', ['$location', function ($location) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/menu.html';
        },
        link: function ($scope, element, attrs) {
            $scope.goToPath = function (path) {
                $location.path(path);
            }
        }
    };
}]);