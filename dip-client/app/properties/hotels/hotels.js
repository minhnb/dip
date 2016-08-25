'use strict';

angular.module('dipApp.properties_hotels', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/properties/hotels', {
            templateUrl: '/properties/hotels/hotels.html',
            controller: 'HotelController'
        });
    }])
    .controller('HotelController', ['$scope', '$timeout', '$rootScope', '$location', 'hotelService', 'hotelUtils',
        function ($scope, $timeout, $rootScope, $location, hotelService, hotelUtils) {
            $rootScope.isNoMenuPage = false;
            $scope.$parent.pageTitle = "HOTELS";
            $scope.isShowingCreateEditHotelBox = false;
            $scope.isShowingProfileImage = false;
            $scope.isShowingListHotels = true;
            $scope.hotelProfilePicture = "";
            $scope.isEditingHotel = false;
            $scope.isShowingButtonCreateHotel = false;

            $scope.hotel = {};
            $scope.list = [];

            $scope.showCreateEditHotelBox = function () {
                $scope.isShowingCreateEditHotelBox = true;
                $scope.isShowingListHotels = false;
            };

            $scope.hideCreateEditHotelBox = function () {
                $scope.isShowingCreateEditHotelBox = false;
                // $scope.isShowingListHotels = $scope.list.length > 0;
                $scope.isShowingListHotels = true;
            };

            $scope.showCreateHotelBox = function () {
                $scope.isEditingHotel = false;
                $scope.initCreateHotelPanel();
                $scope.showCreateEditHotelBox();
            };

            $scope.showEditHotelBox = function (hotel) {
                $scope.initCreateHotelPanel();
                $scope.startSpin();
                hotelService.getHotelById(hotel.id)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        data.neighborhood = data.address.neighborhood;
                        data.city = data.address.city;
                        data.fullAddress = hotelUtils.getHotelFullAddress(data);
                        $scope.hotel = data;
                        $('#image_box_hotel').trigger('setImage', [hotel.imageUrl, hotel.name]);
                        $scope.isEditingHotel = true;
                        $scope.showCreateEditHotelBox();
                    });
            };

            $scope.createHotel = function () {
                if (!hotelUtils.isValidHotel($scope.hotel, true, $scope.translate('ERROR_INVALID_HOTEL_PICTURE'))) {
                    return;
                }
                $scope.startSpin();
                hotelService.createHotel($scope.hotel)
                    .success(function (data, status) {
                        $scope.updateHotelImage(data.id)
                            .success(function () {
                                $scope.actionAfterSaveHotel();
                            });
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.initCreateHotelPanel = function () {
                $scope.hotel = {};
                $('#image_box_hotel').trigger('clearImageBox');
            };

            $scope.updateHotelImage = function (hotelId) {
                var image = $('#image_box_hotel > .input-upload-img')[0].files[0];
                return hotelService.updateHotelImage(hotelId, image)
                    .success(function (data, status) {

                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.editHotel = function () {
                if (!hotelUtils.isValidHotel($scope.hotel, false)) {
                    return;
                }
                $scope.startSpin();
                hotelService.updateHotel($scope.hotel)
                    .success(function (data, status) {
                        if ($('#image_box_hotel > .input-upload-img').val()) {
                            $scope.updateHotelImage(data.id)
                                .success(function () {
                                    $scope.actionAfterSaveHotel();
                                });
                        } else {
                            $scope.actionAfterSaveHotel();
                        }
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.actionAfterSaveHotel = function () {
                $scope.stopSpin();
                $scope.hideCreateEditHotelBox();
                $scope.getListHotel();
            };

            $scope.deleteHotel = function (hotel) {
                utils.notyConfirm($scope.translate('HOTEL_DELETE_CONFIRM', {name: hotel.name}), $scope.okText, $scope.cancelText, function () {
                    $scope.startSpin();
                    var hotelId = hotel.id;
                    hotelService.deleteHotel(hotelId)
                        .success(function (data, status) {
                            $scope.stopSpin();
                            $scope.getListHotel();
                        })
                        .error(function (data, status) {
                            $scope.handleError(data);
                        });
                }, function () {

                });
            };

            $scope.getListHotel = function () {
                $scope.startSpin();
                hotelService.getListHotel()
                    .success(function (data, status) {
                        $scope.displayListHotel(data);
                        $scope.stopSpin();
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.displayListHotel = function (hotels) {
                $scope.list = hotels.map(hotelUtils.convertHotel);
                // $scope.isShowingListHotels = $scope.list.length > 0;
            };

            $scope.init = function () {
                $scope.getListHotel();
            };

            $rootScope.initDipApp($scope.init);
        }]);