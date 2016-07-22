dipApp.directive('dipMenu', ['$location', function ($location) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/menu.html';
        },
        link: function ($scope, element, attrs) {
            function load_scripts() {
                load_script('joli_template/js/actions.js');
            }

            load_scripts();
        }
    };
}]);