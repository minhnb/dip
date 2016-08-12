'use strict';

angular.module('dipApp.properties_hotel', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/properties/hotel/:hotelId', {
            templateUrl: '/properties/hotel/hotel.html',
            controller: 'HotelProfileController'
        });
    }])
    .controller('HotelProfileController', ['$scope', '$timeout', '$rootScope', '$location', '$routeParams', 'hotelService', 'hotelUtils',
        function ($scope, $timeout, $rootScope, $location, $routeParams, hotelService, hotelUtils) {
            $rootScope.isNoMenuPage = false;
            $scope.$parent.pageTitle = "HOTEL_PROFILE";
            $scope.isEditingHotel = false;
            $scope.isShowingCreateModule = false;

            $scope.hotel = {};
            $scope.module = {};

            $scope.getHotelById = function (hotelId) {
                hotelService.getHotelById(hotelId)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        $scope.hotel = hotelUtils.convertHotel(data);
                    });
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
                        $scope.hotel = hotelUtils.convertHotel(data);
                        $('#image_box_hotel > .image-box img').attr('alt', hotel.name + $scope.translate('PROFILE_PICTURE'));
                        if (hotel.imageUrl) {
                            $('#image_box_hotel > .image-box img').attr('src', hotel.imageUrl);
                            $('#image_box_hotel > .image-box img').show();
                        }
                        $scope.isEditingHotel = true;
                    });
            };

            $scope.initCreateHotelPanel = function () {
                $scope.hotel = {};
                $('#image_box_hotel > .input-upload-img').val('');
                $('#image_box_hotel > .image-box img').hide();
                $('#image_box_hotel > .image-box img').attr('src', '');
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
                                .success(function (data, status) {
                                    $scope.hotel.imageUrl = '';
                                    $scope.hotel = hotelUtils.convertHotel(data);
                                    $scope.actionAfterSaveHotel();
                                })
                                .error(function (data, status) {
                                    $scope.handleError(data);
                                });
                        } else {
                            $scope.hotel = hotelUtils.convertHotel(data);
                            $scope.actionAfterSaveHotel();
                        }
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.actionAfterSaveHotel = function () {
                $scope.stopSpin();
                $scope.isEditingHotel = false;
            };

            $scope.cancelEditHotel = function () {
                $scope.isEditingHotel = false;
            };

            $scope.deleteHotel = function (hotel) {
                utils.notyConfirm($scope.translate('HOTEL_DELETE_CONFIRM', {name: hotel.name}), $scope.okText, $scope.cancelText, function () {
                    $scope.startSpin();
                    var hotelId = hotel.id;
                    hotelService.deleteHotel(hotelId)
                        .success(function (data, status) {
                            $scope.stopSpin();
                            $scope.goToPath('/properties/hotels')
                        })
                        .error(function (data, status) {
                            $scope.handleError(data);
                        });
                }, function () {

                });
            };


            $scope.showCreateModuleBox = function () {
                $scope.initCreateModulePanel();
                $scope.isShowingCreateModule = true;
            };

            $scope.hideCreateModuleBox = function () {
                $scope.isShowingCreateModule = false;
            };

            $scope.initCreateModulePanel = function () {
                $scope.module = {};
                $('#image_box_module > .input-upload-img').val('');
                $('#image_box_module > .image-box img').hide();
                $('#image_box_module > .image-box img').attr('src', '');
            };

            $scope.updateHotelServiceImage = function (hotelId) {
                var image = $('#image_box_module > .input-upload-img')[0].files[0];
                return hotelService.updateHotelServiceImage(hotelId, image)
                    .success(function (data, status) {

                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.createModule = function () {
                if (!hotelUtils.isValidHotelService($scope.module, true, $scope.translate('ERROR_INVALID_HOTEL_SERVICE_PICTURE'))) {
                    return;
                }
                $scope.startSpin();
                $scope.module.type = "Pool";
                hotelService.createHotelService($scope.hotel.id, $scope.module)
                    .success(function (data, status) {
                        $scope.updateHotelServiceImage(data.id).then(function () {
                            $scope.hideCreateModuleBox();
                            $scope.getHotelById($routeParams.hotelId);
                        });
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.deleteModule = function (module) {
                utils.notyConfirm($scope.translate('MODULE_DELETE_CONFIRM', {name: module.name}), $scope.okText, $scope.cancelText, function () {
                    $scope.startSpin();
                    hotelService.deleteHotelService($scope.hotel.id, module)
                        .success(function (data, status) {
                            $scope.stopSpin();
                            $scope.getHotelById($routeParams.hotelId);
                        })
                        .error(function (data, status) {
                            $scope.handleError(data);
                        });
                }, function () {

                });
            };

            $scope.init = function () {
                $scope.getHotelById($routeParams.hotelId);
            };

            $rootScope.initDipApp($scope.init);
        }]);