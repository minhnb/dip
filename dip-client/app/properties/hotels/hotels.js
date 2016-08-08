'use strict';

angular.module('dipApp.properties_hotels', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/properties/hotels', {
            templateUrl: '/properties/hotels/hotels.html',
            controller: 'HotelController'
        });
    }])
    .controller('HotelController', ['$scope', '$timeout', '$rootScope', '$location', 'hotelService',
        function ($scope, $timeout, $rootScope, $location, hotelService) {
            $rootScope.isNoMenuPage = false;
            $scope.$parent.pageTitle = "HOTELS";
            $scope.isShowingCreateEditHotelBox = false;
            $scope.isShowingProfileImage = false;
            $scope.isShowingListHotels = false;
            $scope.hotelProfilePicture = "";
            $scope.isEditingHotel = false;

            $scope.hotel = {};
            $scope.list = [];

            $scope.showCreateEditHotelBox = function () {
                $scope.isShowingCreateEditHotelBox = true;
                $scope.isShowingListHotels = false;
            };

            $scope.hideCreateEditHotelBox = function () {
                $scope.isShowingCreateEditHotelBox = false;
                $scope.isShowingListHotels = $scope.list.length > 0;
            };

            $scope.showCreateHotelBox = function () {
                $scope.isEditingHotel = false;
                $scope.initCreateHotelPanel();
                $scope.showCreateEditHotelBox();
            };

            $scope.showEditHotelBox = function (hotel) {
                $scope.startSpin();
                hotelService.getHotelById(hotel.id)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        data.neighborhood = data.address.neighborhood;
                        data.city = data.address.city;
                        data.fullAddress = $scope.getHotelFullAddress(data);
                        $scope.hotel = data;
                        $scope.isEditingHotel = true;
                        $scope.showCreateEditHotelBox();
                    });
            };

            $scope.isValidHotel = function (hotel, requiredImage) {
                if (!hotel.name || !hotel.fullAddress) {
                    return false;
                }
                if (requiredImage && !$('#image_create_hotel > .input-upload-img').val()) {
                    utils.notyErrorMessage($scope.translate('ERROR_INVALID_HOTEL_PICTURE'), true);
                    return false;
                }
                return true;
            };

            $scope.createHotel = function () {
                if (!$scope.isValidHotel($scope.hotel, true)) {
                    return;
                }
                $scope.startSpin();
                hotelService.createHotel($scope.hotel)
                    .success(function (data, status) {
                        $scope.updateHotelImage(data.id).then(function () {
                            $scope.actionAfterSaveHotel();
                        });
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.initCreateHotelPanel = function () {
                $scope.hotel = {};
                $('#image_create_hotel > .input-upload-img').val('');
                $('#image_create_hotel > .image-box img').hide();
                $('#image_create_hotel > .image-box img').attr('src', '');
            };

            $scope.updateHotelImage = function (hotelId) {
                var image = $('#image_create_hotel > .input-upload-img')[0].files[0];
                return hotelService.updateHotelImage(hotelId, image)
                    .success(function (data, status) {

                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.browseImage = function () {
                var imageBoxPreview = $('#image_create_hotel');
                $(imageBoxPreview).find('.input-upload-img').change(function () {
                    var inputElement = this;
                    imageBoxPreview.find('.image-box > .load-image-spinner').show();

                    if ($(inputElement)[0].files && $(inputElement)[0].files[0]) {
                        var maxFileSize = MAX_IMAGE_SIZE_MB * 1024 * 1024;
                        if ($(inputElement)[0].files[0].size > maxFileSize) {
                            imageBoxPreview.find('.image-box > .load-image-spinner').hide();
                            utils.notyErrorMessage($scope.translate('ERROR_MAX_FILE_SIZE', {number: MAX_IMAGE_SIZE_MB}), true);
                            inputElement.val('');
                            return;
                        }
                        var reader = new FileReader();

                        reader.onload = function (e) {
                            imageBoxPreview.find('.image-box > img').attr('src', e.target.result);
                            imageBoxPreview.find('.image-box > img').show();
                            imageBoxPreview.find('.image-box > .load-image-spinner').hide();
                        };

                        reader.readAsDataURL($(inputElement)[0].files[0]);
                    }
                });
                $(imageBoxPreview).find('.input-upload-img').click();
            };

            $scope.editHotel = function () {
                if (!$scope.isValidHotel($scope.hotel, false)) {
                    return;
                }
                $scope.startSpin();
                hotelService.updateHotel($scope.hotel)
                    .success(function (data, status) {
                        if ($('#image_create_hotel > .input-upload-img').val()) {
                            $scope.updateHotelImage(data.id).then(function () {
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

            $scope.getHotelFullAddress = function (hotel) {
                var address = [hotel.address.street, hotel.address.city, hotel.address.state];
                return address.filter(Boolean).join(", ");
            };

            $scope.displayListHotel = function (hotels) {
                $scope.list = hotels.map(function (hotel) {
                    hotel.fullAddress = $scope.getHotelFullAddress(hotel);
                    if (hotel.instagram) {
                        hotel.instagramUrl = "https://www.instagram.com/" + hotel.instagram.replace('@', '');
                    } else {
                        hotel.instagramUrl = "";
                    }
                    if (hotel.imageUrl) {
                        hotel.imageUrl = hotel.imageUrl + '_resized';
                    }
                    return hotel;
                });
                $scope.isShowingListHotels = $scope.list.length > 0;
            };

            $scope.init = function () {
                $scope.getListHotel();
            };

            $rootScope.initDipApp($scope.init);
        }]);