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
            $scope.isShowingHotelProfile = false;
            $scope.isEditingHotel = false;
            $scope.isShowingCreateModule = false;
            $scope.mapPureHotelService = [];

            $scope.hotel = {};
            $scope.module = {};

            $scope.poolTypes = [
                {display: $scope.translate('OTHERS'), value: POOL_TYPE_OTHERS},
                {display: $scope.translate('IN_DOOR'), value: POOL_TYPE_INDOOR},
                {display: $scope.translate('OUT_DOOR'), value: POOL_TYPE_OUTDOOR}
            ];
            hotelUtils.setPoolTypes($scope.poolTypes);

            $scope.getHotelById = function (hotelId) {
                hotelService.getHotelById(hotelId)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        data.services.map(function (module) {
                            module = hotelUtils.convertHotelService(module);
                            module.isEditingModuleInfo = false;
                            $scope.mapPureHotelService[module.id] = Object.assign({}, module);
                        });
                        $scope.hotel = hotelUtils.convertHotel(data);
                        $scope.isShowingHotelProfile = true;
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
                $scope.module.poolType = POOL_TYPE_OTHERS;
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
                $scope.module.type = MODULE_TYPE_POOL;
                hotelService.createHotelService($scope.hotel.id, $scope.module)
                    .success(function (data, status) {
                        $scope.updateHotelServiceImage(data.id)
                            .success(function () {
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

            $scope.showEditModuleBox = function (module) {
                if (module.imageUrl) {
                    $('#image_box_module_' + module.id + ' > .image-box img').attr('src', module.imageUrl);
                    $('#image_box_module_' + module.id + ' > .image-box img').show();
                }
                module.isEditingModuleInfo = true;
            };

            $scope.hideEditModuleBox = function (module) {
                module.isEditingModuleInfo = false;
            };

            $scope.discardChangeModule = function (module) {
                var pureModule = $scope.mapPureHotelService[module.id];
                for (var key in pureModule) {
                    module[key] = pureModule[key];
                }
            };

            $scope.updateModuleImage = function (moduleId) {
                var image = $('#image_box_module_' + moduleId + ' > .input-upload-img')[0].files[0];
                return hotelService.updateHotelServiceImage(moduleId, image)
                    .success(function (data, status) {

                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.editModule = function (module) {
                if (!hotelUtils.isValidHotelService(module, false)) {
                    return;
                }
                $scope.startSpin();
                hotelService.updateHotelService(module)
                    .success(function (data, status) {
                        if ($('#image_box_module_' + module.id + ' > .input-upload-img').val()) {
                            $scope.updateModuleImage(data.id)
                                .success(function (data, status) {
                                    module.imageUrl = data.imageUrl;
                                    $scope.actionAfterSaveModule(module);
                                });
                        } else {
                            $scope.actionAfterSaveModule(module);
                        }
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.actionAfterSaveModule = function (module) {
                $scope.hideEditModuleBox(module);
                $scope.getHotelById($routeParams.hotelId);
            };

            $scope.init = function () {
                $scope.getHotelById($routeParams.hotelId);
            };

            $rootScope.initDipApp($scope.init);
        }]);