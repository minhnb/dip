dipApp.directive('dipHotelInfoContent', ['$location', function ($location) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/properties/hotels/hotel-info-content.html';
        },
        replace:true,
        link: function ($scope, element, attrs) {

        }
    };
}]);