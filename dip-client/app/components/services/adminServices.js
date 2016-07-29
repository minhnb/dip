dipApp.factory('adminService', ['$q', '$http', '$localStorage',
    function ($q, $http, $localStorage) {
        var apiReportUrl = config.DIP_API + "admin",
            adminService = {};
        adminService = {
            updateAppContext: function () {
                return $http.post(apiReportUrl + "/appcontext/update")
                    .success(function (data, status, headers, config) {
                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            }
        };
        return adminService;
    }]);