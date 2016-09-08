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
                var update = Object.assign({}, hotel);
                delete update.services;
                return $http.put(apiHotelUrl + "/" + hotelId, update);
            },
            deleteHotel: function (hotelId) {
                return $http.delete(apiHotelUrl + "/" + hotelId);
            },
            getListHotel: function (hotelStatus) {
                var apiUrl = apiListHotelUrl;
                switch (hotelStatus) {
                    case HOTEL_STATUS_APPROVED:
                        apiUrl += '/approved';
                        break;
                    case HOTEL_STATUS_PENDING:
                        apiUrl += '/pending';
                        break;
                    default:
                }
                return $http.get(apiUrl);
            },
            changeHotelStatus: function (hotelId, status) {
                return $http.put(apiHotelUrl + "/" + hotelId + '/status', {active: status});
            },
            createHotelService: function (hotelId, hotelService) {
                return $http.post(apiHotelUrl + '/' + hotelId + '/service', hotelService);
            },
            updateHotelServiceImage: function (hotelId, hoteServicelId, image) {
                var fd = new FormData();
                fd.append('image', image);
                return $http.put(apiHotelUrl + "/" + hotelId + "/service/" + hoteServicelId + "/image", fd,
                    {
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    });
            },
            getHotelServiceById: function (hotelServiceId) {
                return $http.get(apiHotelUrl + "/service/" + hotelServiceId);
            },
            updateHotelService: function (hotelId, hotelService) {
                var hotelServiceId = hotelService.id;
                return $http.put(apiHotelUrl + "/" + hotelId + "/service/" + hotelServiceId, hotelService);
            },
            deleteHotelService: function (hotelId, hotelService) {
                var hotelServiceId = hotelService.id;
                return $http.delete(apiHotelUrl + '/' + hotelId + '/service/' + hotelServiceId);
            },
            createPass: function (hotelId, hotelServiceId, pass) {
                return $http.post(apiHotelUrl + '/' + hotelId + '/service/' + hotelServiceId + '/pass', pass);
            },
            getPassById: function (passId) {
                return $http.get(apiHotelUrl + "/pass/" + passId);
            },
            getPassesByHotel: function (hotelId) {
                return $http.get(apiHotelUrl + "/" + hotelId + "/passes");
            },
            updatePass: function (pass) {
                var passId = pass.id;
                return $http.put(apiHotelUrl + '/pass/' + passId, pass);
            },
            deletePass: function (passId) {
                return $http.delete(apiHotelUrl + "/pass/" + passId);
            }
        };
        return hotelService;
    }]);