dipApp.factory('hotelService', ['$q', '$http', '$localStorage',
    function ($q, $http, $localStorage) {
        var apiHotelUrl = config.DIP_API + "hotel",
            apiListHotelUrl = config.DIP_API + "hotels",
            hotelService = {};
        hotelService = {
            createHotel: function (hotel) {
                return $http.post(apiHotelUrl, hotel);
            },
            updateHotelImage: function (hotelId, image) {
                var fd = new FormData();
                fd.append('image', image);
                return $http.put(apiHotelUrl + "/" + hotelId + "/image", fd,
                    {
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    });
            },
            getHotelById: function (hotelId) {
                return $http.get(apiHotelUrl + "/" + hotelId);
            },
            updateHotel: function (hotel) {
                var hotelId = hotel.id;
                delete hotel.services;
                return $http.put(apiHotelUrl + "/" + hotelId, hotel);
            },
            deleteHotel: function (hotelId) {
                return $http.delete(apiHotelUrl + "/" + hotelId);
            },
            getListHotel: function () {
                return $http.get(apiListHotelUrl + '/pending');
            },
            createHotelService: function (hotelId, hotelService) {
                return $http.post(apiHotelUrl + '/' + hotelId + '/service', hotelService);
            },
            updateHotelServiceImage: function (hoteServicelId, image) {
                var fd = new FormData();
                fd.append('image', image);
                return $http.put(apiHotelUrl + "/service/" + hoteServicelId + "/image", fd,
                    {
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    });
            },
            getHotelServiceById: function (hotelServiceId) {
                return $http.get(apiHotelUrl + "/service/" + hotelServiceId);
            },
            updateHotelService: function (hotelService) {
                var hotelServiceId = hotelService.id;
                return $http.put(apiHotelUrl + "/service/" + hotelServiceId, hotelService);
            },
            deleteHotelService: function (hotelId, hotelService) {
                var hotelServiceId = hotelService.id;
                return $http.delete(apiHotelUrl + '/' + hotelId + '/service/' + hotelServiceId);
            },
            createPass: function (hotelId, hotelServiceId, pass) {
                return $http.post(apiHotelUrl + '/' + hotelId + '/service/' + hotelServiceId + '/pass', pass);
            }
        };
        return hotelService;
    }]);