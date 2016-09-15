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
            getListHotel: function (key, hotelSubmissionStatus) {
                var apiUrl = apiListHotelUrl;
                switch (key) {
                    case HOTEL_KEY_ALL:
                        break;
                    case HOTEL_KEY_ON_AIR:
                        apiUrl += '/live';
                        break;
                    case HOTEL_KEY_INITIAL:
                        apiUrl += '/initial';
                        break;
                    case HOTEL_KEY_SUBMISSION:
                        apiUrl += '/submission';
                        switch (hotelSubmissionStatus) {
                            case HOTEL_STATUS_APPROVED:
                                apiUrl += '/approved';
                                break;
                            case HOTEL_STATUS_DECLINED:
                                apiUrl += '/declined';
                                break;
                            case HOTEL_STATUS_PENDING:
                                apiUrl += '/pending';
                                break;
                            default:
                        }
                        break;
                    default:
                }
                return $http.get(apiUrl);
            },
            changeHotelStatus: function (hotelId, status) {
                return $http.put(apiHotelUrl + "/" + hotelId + '/status', {active: status});
            },
            submitHotel: function (hotelId) {
                return $http.put(apiHotelUrl + "/" + hotelId + '/submit', {});
            },
            approveHotel: function (hotelId) {
                return $http.put(apiHotelUrl + "/" + hotelId + '/approve', {});
            },
            declineHotel: function (hotelId, failReason) {
                return $http.put(apiHotelUrl + "/" + hotelId + '/decline',
                    {
                        submission: {
                            failReason: failReason
                        }
                    }
                );
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
            },
            getListDipLocation: function () {
                return $http.get(config.DIP_API + 'locations');
            }
        };
        return hotelService;
    }]);