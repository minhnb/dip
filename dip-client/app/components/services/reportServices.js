dipApp.factory('reportService', ['$q', '$http', '$localStorage',
    function ($q, $http, $localStorage) {
        let apiReportUrl = config.DIP_API + "admin/report",
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
                return $http.get(apiReportUrl + "/reservation/events")
                    .success(function (data, status, headers, config) {
                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            getHotelReservationsReport: function () {
                return $http.get(apiReportUrl + "/reservation/hotels")
                    .success(function (data, status, headers, config) {
                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            }
        };
        return reportService;
    }]);