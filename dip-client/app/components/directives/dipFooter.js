dipApp.directive('dipFooter', ['$location', function ($location) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/footer.html';
        },
        link: function ($scope, element, attrs) {

        }
    };
}]);