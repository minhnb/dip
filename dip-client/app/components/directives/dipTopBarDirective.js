dipApp.directive('dipTopBar', [function (userService) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/top-bar.html';
        },
        link: function ($scope, element, attrs) {

        }
    };
}]);