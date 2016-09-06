dipApp.factory('reportService', ['$q', '$http', '$localStorage',
    function ($q, $http, $localStorage) {
        var apiReportUrl = config.DIP_API + "reports",
            reportService = {};
        reportService = {
            getUserReport: function () {
                return $http.get(apiReportUrl + "/users");
            },
            getEventReservationsReport: function () {
                return $http.get(apiReportUrl + "/reservations/events");
            },
            getHotelReservationsReport: function () {
                return $http.get(apiReportUrl + "/reservations/hotels");
            }
        };
        return reportService;
    }]);