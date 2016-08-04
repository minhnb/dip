dipApp.factory('hotelService', ['$q', '$http', '$localStorage',
    function ($q, $http, $localStorage) {
        var apiHotelUrl = config.DIP_API + "hotel",
            apiListHotelUrl = config.DIP_API + "hotels",
            hotelService = {};
        hotelService = {
            createHotel: function (hotel) {
                return $http.post(apiHotelUrl, hotel)
                    .success(function (data, status, headers, config) {
                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            updateHotelImage: function (hotelId, image) {
                var fd = new FormData();
                fd.append('image', image);
                return $http.put(apiHotelUrl + "/" + hotelId + "/image", fd,
                    {
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    })
                    .success(function (data, status, headers, config) {

                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            getListHotel: function () {
                return $http.get(apiListHotelUrl + '/pending')
                    .success(function (data, status, headers, config) {

                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            }
        };
        return hotelService;
    }]);