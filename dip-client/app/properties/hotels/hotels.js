'use strict';

angular.module('dipApp.properties_hotels', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/properties/hotels/on-air', {
                templateUrl: '/properties/hotels/on-air-hotels.html',
                controller: 'HotelController'
            })
            .when('/properties/hotels/initial', {
                templateUrl: '/properties/hotels/initial-hotels.html',
                controller: 'HotelController'
            })
            .when('/properties/hotels/submission', {
                templateUrl: '/properties/hotels/submission-hotels.html',
                controller: 'HotelController'
            })
            .when('/properties/hotels/all', {
                templateUrl: '/properties/hotels/all-hotels.html',
                controller: 'HotelController'
            })
            .when('/properties/hotels', {
                templateUrl: '/properties/hotels/all-hotels.html',
                controller: 'HotelController'
            });
    }])
    .controller('HotelController', ['$scope', '$timeout', '$rootScope', '$location', 'hotelService', 'hotelUtils', 'formValidatorUtils',
        function ($scope, $timeout, $rootScope, $location, hotelService, hotelUtils, formValidatorUtils) {
            $rootScope.isNoMenuPage = false;
            // $rootScope.pageTitle = "LIST_HOTELS";
            $scope.isShowingCreateEditHotelBox = false;
            $scope.isShowingProfileImage = false;
            $scope.isShowingListHotels = false;
            $scope.hotelProfilePicture = "";
            $scope.isEditingHotel = false;
            $scope.isShowingButtonCreateHotel = false;

            $scope.HOTEL_STATUS_APPROVED = HOTEL_STATUS_APPROVED;
            $scope.HOTEL_STATUS_DECLINED = HOTEL_STATUS_DECLINED;
            $scope.HOTEL_STATUS_PENDING = HOTEL_STATUS_PENDING;
            $scope.HOTEL_STATUS_ALL = HOTEL_STATUS_ALL;

            $scope.filterHotelStatus = $scope.HOTEL_STATUS_APPROVED;

            $scope.KEY_ALL = HOTEL_KEY_ALL;
            $scope.KEY_INITIAL = HOTEL_KEY_INITIAL;
            $scope.KEY_ON_AIR = HOTEL_KEY_ON_AIR;
            $scope.KEY_SUBMISSION = HOTEL_KEY_SUBMISSION;

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

            $scope.stateSelected = function () {
                $('form[name="create-hotel"] input[ng-model="hotel.address.state"]').trigger('change');
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
                $('form[name="create-hotel"]').validator('reset');
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
                if ($scope.filterHotelStatus == $scope.HOTEL_STATUS_APPROVED) {
                    $scope.filterHotelStatus = $scope.HOTEL_STATUS_PENDING;
                    $('.box.list-hotel > .nav-tabs-custom > ul > li.tab-pending-hotel > a').tab('show');
                }
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
                hotelService.getListHotel($scope.key, $scope.filterHotelStatus)
                    .success(function (data, status) {
                        if ($scope.key == $scope.KEY_ALL || $scope.key == $scope.KEY_INITIAL) {
                            if (data.length == 1) {
                                var hotel = data[0];
                                $scope.goToPath('properties/hotel/' + hotel.id);
                                return;
                            }
                        }
                        $scope.displayListHotel(data);
                        $scope.stopSpin();

                        formValidatorUtils.initDIPDefaultFormValidator($('form[name="create-hotel"]'), $scope.createHotel);
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.toggleHotelStatus = function (hotel) {
                hotel.displayActive = !hotel.displayActive;
                if (hotel.displayActive && !hotel.dipLocation) {
                    $scope.notifyValidateError('ERROR_HOTEL_NEED_LOCATION_BEFORE_APPROVE');
                    setTimeout(function () {
                        hotel.displayActive = !hotel.displayActive;
                        $scope.$apply();
                    }, 500);
                    return;
                }
                utils.notyConfirm($scope.translate(hotel.displayActive ? 'HOTEL_APPROVE_CONFIRM' : 'HOTEL_UNAPPROVE_CONFIRM', {name: hotel.name}),
                    $scope.okText, $scope.cancelText, function () {
                        $scope.startSpin();
                        var hotelId = hotel.id;
                        hotelService.changeHotelStatus(hotelId, hotel.displayActive)
                            .success(function (data, status) {
                                $scope.stopSpin();
                                hotel.active = hotel.displayActive;
                            })
                            .error(function (data, status) {
                                $scope.handleError(data);
                                hotel.displayActive = !hotel.displayActive;
                            });
                    }, function () {
                        hotel.displayActive = !hotel.displayActive;
                        setTimeout(function () {
                            $scope.$apply();
                        },0);
                    });
            };

            $scope.submitHotel = function (hotel) {
                if (!hotel.dipLocation) {
                    $scope.notifyValidateError('ERROR_HOTEL_NEED_LOCATION_BEFORE_SUBMIT');
                    return;
                }
                utils.notyConfirm($scope.translate('HOTEL_SUBMIT_CONFIRM', {name: hotel.name}),
                    $scope.okText, $scope.cancelText, function () {
                        $scope.startSpin();
                        var hotelId = hotel.id;
                        hotelService.submitHotel(hotelId)
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

            $scope.approveHotel = function (hotel) {
                if (!hotel.dipLocation) {
                    $scope.notifyValidateError('ERROR_HOTEL_NEED_LOCATION_BEFORE_APPROVE');
                    return;
                }
                utils.notyConfirm($scope.translate('HOTEL_APPROVE_CONFIRM', {name: hotel.name}),
                    $scope.okText, $scope.cancelText, function () {
                        $scope.startSpin();
                        var hotelId = hotel.id;
                        hotelService.approveHotel(hotelId)
                            .success(function (data, status) {
                                $scope.stopSpin();
                                if ($scope.key != $scope.KEY_ALL) {
                                    $scope.getListHotel();
                                } else {
                                    hotel.active = true;
                                    hotel.submission.status = HOTEL_STATUS_APPROVED;
                                    hotelUtils.setHotelActiveStatus(hotel);
                                    hotelUtils.setHotelSubmissionStatus(hotel);
                                }
                            })
                            .error(function (data, status) {
                                $scope.handleError(data);
                            });
                    }, function () {

                    });
            };

            $scope.declineHotel = function (hotel) {
                utils.notyConfirmWithTextbox($scope.translate('CONFIRM_PROVIDE_REASON_FOR_DECLINING_HOTEL', {name: hotel.name}),
                    $scope.okText, $scope.cancelText, function (failReason) {
                        $scope.startSpin();
                        var hotelId = hotel.id;
                        hotelService.declineHotel(hotelId, failReason)
                            .success(function (data, status) {
                                $scope.stopSpin();
                                if ($scope.key != $scope.KEY_ALL) {
                                    $scope.getListHotel();
                                } else {
                                    hotel.submission.status = HOTEL_STATUS_DECLINED;
                                    hotelUtils.setHotelSubmissionStatus(hotel);
                                }
                            })
                            .error(function (data, status) {
                                $scope.handleError(data);
                            });
                    }, function () {

                    });
            };

            $scope.displayListHotel = function (hotels) {
                $scope.list = hotels.map(hotelUtils.convertHotel);
                $scope.isShowingListHotels = $scope.list.length > 0;
            };

            $scope.loadListHotelByStatus = function (hotelStatus) {
                if ($scope.filterHotelStatus == hotelStatus) {
                    return;
                }
                $scope.filterHotelStatus = hotelStatus;
                $scope.getListHotel();
            };

            $scope.initHotelPageTitle = function (key) {
                switch (key) {
                    case $scope.KEY_ALL:
                        $rootScope.pageTitle = 'LIST_ALL_HOTELS';
                        break;
                    case $scope.KEY_ON_AIR:
                        $rootScope.pageTitle = 'LIST_ON_AIR_HOTELS';
                        break;
                    case $scope.KEY_INITIAL:
                        $rootScope.pageTitle = 'LIST_INITIAL_HOTELS';
                        break;
                    case $scope.KEY_SUBMISSION:
                        $rootScope.pageTitle = 'LIST_SUBMISSION_HOTELS';
                        break;
                    default:
                }
            };

            $scope.init = function () {
                $scope.initHotelPageTitle($scope.key);
                $scope.getListHotel();
            };

            $rootScope.initDipApp($scope.init);
        }]);