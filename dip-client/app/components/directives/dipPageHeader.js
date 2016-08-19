dipApp.directive('dipPageHeader', ['$location', function ($location) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/page-header.html';
        },
        link: function ($scope, element, attrs) {

        }
    };
}]);