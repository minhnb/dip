dipApp.factory('reportService', ['$q', '$http', '$localStorage',
    function ($q, $http, $localStorage) {
        var apiReportUrl = config.DIP_API + "admin/reports",
            reportService = {};
        reportService = {
            getUserReport: function () {
                return $http.get(apiReportUrl + "/users")
                    .success(function (data, status, headers, config) {
                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            getEventReservationsReport: function () {
                return $http.get(apiReportUrl + "/reservations/events")
                    .success(function (data, status, headers, config) {
                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            getHotelReservationsReport: function () {
                return $http.get(apiReportUrl + "/reservations/hotels")
                    .success(function (data, status, headers, config) {
                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            }
        };
        return reportService;
    }]);