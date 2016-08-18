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

            $scope.isInitializedCreatePassForm = false;

            $scope.hotel = {};
            $scope.module = {};

            $scope.poolTypes = [
                {display: $scope.translate('OTHERS'), value: POOL_TYPE_OTHERS},
                {display: $scope.translate('IN_DOOR'), value: POOL_TYPE_INDOOR},
                {display: $scope.translate('OUT_DOOR'), value: POOL_TYPE_OUTDOOR}
            ];
            hotelUtils.setPoolTypes($scope.poolTypes);

            $scope.passTypes = [
                {display: $scope.translate('PASS_TYPE_POOL_PASS'), value: PASS_TYPE_POOL_PASS},
                {display: $scope.translate('PASS_TYPE_DAYBED'), value: PASS_TYPE_DAYBED},
                {display: $scope.translate('PASS_TYPE_CABANA'), value: PASS_TYPE_CABANA}
            ];
            hotelUtils.setPassTypes($scope.passTypes);

            $scope.getHotelById = function (hotelId) {
                hotelService.getHotelById(hotelId)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        data.services.map(function (module) {
                            module = hotelUtils.convertHotelService(module);
                            module.isEditingModuleInfo = false;
                            module.isAddingPass = false;
                            module.newPass = $scope.initNewPass(module);
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

            $scope.initNewPass = function (module) {
                var newPass = {};
                newPass.service = module.id;
                newPass.allotmentCount = 10;
                newPass.capacity = 10;
                newPass.passType = '';
                return newPass;
            };

            $scope.showCreatePassBox = function (module) {
                $scope.initCreatePassForm();
                var moduleId = module.id;
                $scope.hotel.services.map(function (module) {
                    if (module.id == moduleId) {
                        return;
                    }
                    if (module.isAddingPass) {
                        $scope.hideCreatePassBox(module);
                    }
                });
                module.isAddingPass = true;
            };

            $scope.hideCreatePassBox = function (module) {
                module.isAddingPass = false;
                $scope.isInitializedCreatePassForm = false;
                module.newPass = $scope.initNewPass(module);
            };

            $scope.isValidPass = function (newPass, $event) {
                var form = $($event.currentTarget).parent().parent();
                if (!newPass.passType) {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_TYPE');
                }
                if (!newPass.title) {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_TITLE');
                }
                var startTime = $(form).find('[data-duration="start"]').val();
                if (startTime == '') {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_DURATION_START_TIME');
                }
                var endTime = $(form).find('[data-duration="end"]').val();
                if (endTime == '') {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_DURATION_END_TIME');
                }
                var allotmentCount = $(form).find('[ng-model="pass.allotmentCount"]').val();
                if (!allotmentCount) {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_MAXIMUM');
                }
                var capacity = $(form).find('[ng-model="pass.capacity"]').val();
                if (!capacity) {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_CAPACITY');
                }
                var price = parseFloat($(form).find('[ng-model="pass.price"]').inputmask('unmaskedvalue'));
                if (!price) {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_PRICE');
                }
                var duration = {};
                duration.startTime = utils.convertTimeToDuration(startTime);
                duration.endTime = utils.convertTimeToDuration(endTime);
                if (duration.startTime >= duration.endTime) {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_DURATION');
                }
                newPass.duration = duration;
                newPass.capacity = capacity;
                newPass.allotmentCount = allotmentCount;
                newPass.price = price * 100;
                return newPass;
            };

            $scope.createPass = function (pass, module, $event) {
                var newPass = $scope.isValidPass(pass, $event);
                if (!newPass) {
                    return;
                }
                newPass.type = 'pass';
                newPass.startDay = '0000-01-01';
                newPass.dueDay = '9999-12-31';
                $scope.startSpin();
                hotelService.createPass($scope.hotel.id, module.id, newPass)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        $scope.hideCreatePassBox(module);
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.updatePassTitle = function (pass) {
                pass.title = hotelUtils.getPassTypeDisplay(pass.passType);
            };

            $scope.initTimePicker = function () {
                $('.timepicker input').timepicker({
                    showInputs: false,
                    defaultTime: false,
                    showMeridian: false,
                    showWidgetOnAddonClick: true
                });
                $('.timepicker .input-group-addon').click(function () {
                    $(this).parent().find('input').data('timepicker').showWidget();
                });


                $('.timepicker input').timepicker().on('show.timepicker', function(e) {
                    // console.log(e.time);
                    if ($(this).attr('data-duration') == 'end') {
                        var duration_start = $(this).parent().parent().parent().find('[data-duration=start]');

                        if ($(duration_start).val()) {
                            var startTime = $(duration_start).val();
                            var endTime =  $(this).val();
                            if (startTime >= endTime) {
                                $(this).data('timepicker').setTime(startTime);
                                $(this).data('timepicker').incrementHour();
                                $(this).data('timepicker').update();
                            }
                            return;
                        }
                    }
                    if (!$(this).val()) {
                        $(this).data('timepicker').setTime(new Date());
                        $(this).data('timepicker').incrementMinute();
                        $(this).data('timepicker').update();
                    }
                });
            };

            $scope.initCreatePassForm = function () {
                if ($scope.isInitializedCreatePassForm) {
                    return;
                }
                $scope.isInitializedCreatePassForm = true;
                $scope.initTimePicker();
                $('.slider').slider();
                $("[data-mask]").inputmask();
            };

            $scope.init = function () {
                $scope.getHotelById($routeParams.hotelId);
            };

            $rootScope.initDipApp($scope.init);
        }]);