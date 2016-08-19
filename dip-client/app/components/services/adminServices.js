dipApp.factory('adminService', ['$q', '$http', '$localStorage',
    function ($q, $http, $localStorage) {
        var apiReportUrl = config.DIP_API + "admin",
            adminService = {};
        adminService = {
            updateAppContext: function () {
                return $http.post(apiReportUrl + "/appcontext/update");
            }
        };
        return adminService;
    }]);