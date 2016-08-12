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
            getHotelById: function (hotelId) {
                return $http.get(apiHotelUrl + "/" + hotelId)
                    .success(function (data, status, headers, config) {

                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            updateHotel: function (hotel) {
                var hotelId = hotel.id;
                delete hotel.services;
                return $http.put(apiHotelUrl + "/" + hotelId, hotel)
                    .success(function (data, status, headers, config) {

                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            deleteHotel: function (hotelId) {
                return $http.delete(apiHotelUrl + "/" + hotelId)
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
            },
            createHotelService: function (hotelId, hotelService) {
                return $http.post(apiHotelUrl + '/' + hotelId + '/service', hotelService)
                    .success(function (data, status, headers, config) {

                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            updateHotelServiceImage: function (hoteServicelId, image) {
                var fd = new FormData();
                fd.append('image', image);
                return $http.put(apiHotelUrl + "/service/" + hoteServicelId + "/image", fd,
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
            getHotelServiceById: function (hotelServiceId) {
                return $http.get(apiHotelUrl + "/service/" + hotelServiceId)
                    .success(function (data, status, headers, config) {

                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            deleteHotelService: function (hotelId, hotelService) {
                var hotelServiceId = hotelService.id;
                return $http.delete(apiHotelUrl + '/' + hotelId + '/service/' + hotelServiceId)
                    .success(function (data, status, headers, config) {

                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            }
        };
        return hotelService;
    }]);