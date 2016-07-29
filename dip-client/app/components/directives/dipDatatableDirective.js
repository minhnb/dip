dipApp.directive('dipDatatable', function () {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/datatable.html';
        },
        link: function ($scope, element, attrs) {
            $scope.isShowDataTable = false;
            $scope.bindingDatatable = function () {
                setTimeout(function () {
                    $('#dipdatatable').dataTable();
                    $scope.isShowDataTable = true;
                    $scope.$apply();
                }, 500);
            };

            $scope.getCellValue = function (row, col) {
                return utils.getObjectValueByKey(row, col);
            }
        }
    };
});