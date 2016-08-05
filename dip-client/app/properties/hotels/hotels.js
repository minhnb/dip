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
            $scope.isShowingCreateHotelBox = false;
            $scope.isShowingProfileImage = false;
            $scope.isShowingListHotels = false;
            $scope.hotelProfilePicture = "";

            $scope.hotel = {};
            $scope.list = [];

            $scope.showCreateHotelBox = function () {
                $scope.isShowingCreateHotelBox = true;
            };

            $scope.hideCreateHotelBox = function () {
                $scope.isShowingCreateHotelBox = false;
            };

            $scope.isValidHotel = function (hotel) {
                if (!hotel.name || !hotel.fullAddress) {
                    return false;
                }
                if (!$('#image_create_hotel > .input-upload-img').val()) {
                    utils.notyErrorMessage('Invalid hotel profile picture', true);
                    return false;
                }
                return true;
            };

            $scope.createHotel = function () {
                if (!$scope.isValidHotel($scope.hotel)) {
                    return;
                }
                $scope.startSpin();
                hotelService.createHotel($scope.hotel)
                    .success(function (data, status) {
                        $scope.updateHotelImage(data.id);
                    })
                    .error(function (data, status) {
                        utils.notyErrorMessage(data.details, true);
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
                hotelService.updateHotelImage(hotelId, image)
                    .success(function (data, status) {
                        $scope.initCreateHotelPanel();
                        $scope.stopSpin();
                        $scope.hideCreateHotelBox();
                        $scope.getListHotel();
                    })
                    .error(function (data, status) {
                        $scope.stopSpin();
                    });
            };

            $scope.browseImage = function () {
                var imageBoxPreview = $('#image_create_hotel');
                $(imageBoxPreview).find('.input-upload-img').change(function () {
                    var inputElement = this;
                    imageBoxPreview.find('.image-box > .load-image-spinner').show();

                    if ($(inputElement)[0].files && $(inputElement)[0].files[0]) {
                        var maxFileSize = 5242880;
                        if ($(inputElement)[0].files[0].size > maxFileSize) {
                            imageBoxPreview.find('.image-box > .load-image-spinner').hide();
                            utils.notyErrorMessage("Allowed file size exceeded. (Max. 5 MB)", true);
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

            $scope.getListHotel = function () {
                $scope.startSpin();
                hotelService.getListHotel()
                    .success(function (data, status) {
                        $scope.displayListHotel(data);
                        $scope.stopSpin();
                    })
                    .error(function (data, status) {

                    });
            };

            $scope.displayListHotel = function (hotels) {
                $scope.list = hotels.map(function (hotel) {
                    var address = [hotel.address.street, hotel.address.city, hotel.address.state];
                    hotel.fullAddress = address.filter(Boolean).join(", ");
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
                $scope.isShowingListHotels = hotels.length > 0;
            };

            $scope.init = function () {
                $scope.getListHotel();
            };

            $rootScope.initDipApp($scope.init);
        }]);