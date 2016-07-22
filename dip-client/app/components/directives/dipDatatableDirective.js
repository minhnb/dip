dipApp.directive('dipDatatable', function () {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/datatable.html';
        },
        link: function ($scope, element, attrs) {
            $scope.bindingDatatable = function () {
                setTimeout(function () {
                    $('#dipdatatable').dataTable();
                    $('#dipdatatable').on('page.dt',function () {
                        onresize(100);
                    });
                }, 500);
            };

            $scope.getCellValue = function (row, col) {
                return getObjectValueByKey(row, col);
            }
        }
    };
});