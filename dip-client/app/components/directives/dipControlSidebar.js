dipApp.directive('dipControlSidebar', ['$location', function ($location) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/control-sidebar.html';
        },
        link: function ($scope, element, attrs) {

        }
    };
}]);