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
            $scope.mapPurePass = [];

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
                return hotelService.getHotelById(hotelId)
                    .success(function (data, status) {
                        var hotel = hotelUtils.convertHotel(data);
                        for (var key in hotel) {
                            if (key != 'services') {
                                $scope.hotel[key] = hotel[key];
                            }
                        }
                        $scope.stopSpin();
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.getHotelProfile = function (hotelId) {
                $scope.startSpin();
                $scope.getHotelById(hotelId)
                    .success(function (data, status) {
                        var hotel = data;
                        $scope.bindingModules(hotel.services);
                        $scope.startSpin();
                        $scope.getPasses(hotelId).then(function () {
                            $scope.isShowingHotelProfile = true;
                            $scope.stopSpin();
                        });
                    });
            };

            $scope.getPasses = function (hotelId) {
                $scope.startSpin();
                return hotelService.getPassesByHotel(hotelId)
                    .success(function (data, status) {
                        var passes = data;
                        var moduleMapById = [];
                        $scope.hotel.services.map(function (module) {
                            module.passes = [];
                            moduleMapById[module.id] = module;
                        });
                        passes.map(function (pass) {
                            if (moduleMapById[pass.service]) {
                                pass = hotelUtils.convertPass(pass);
                                pass.isEditingPassInfo = false;
                                moduleMapById[pass.service].passes.push(pass);
                                $scope.mapPurePass[pass.id] = Object.assign({}, pass);
                            }
                        });

                    });
            };

            $scope.bindingModules = function (services) {
                var serviceMap = [];
                if ($scope.hotel.services) {
                    $scope.hotel.services.map(function (module) {
                        serviceMap[module.id] = module;
                    });
                } else {
                    $scope.hotel.services = services.map(function (module) {
                        return $scope.convertModule(module);
                    });
                    return;
                }
                $scope.hotel.services = services.map(function (module) {
                    var converted_module = $scope.convertModule(module);
                    var pureModule = Object.assign({}, $scope.mapPureHotelService[module.id]);
                    $scope.mapPureHotelService[module.id] = Object.assign({}, converted_module);
                    if (serviceMap[module.id]) {
                        if (serviceMap[module.id].isEditingModuleInfo) {
                            converted_module.isEditingModuleInfo = true;
                            converted_module = hotelUtils.updateEditingModule(serviceMap[module.id], converted_module, pureModule);
                        } else {
                            converted_module.isEditingModuleInfo = false;
                        }

                        if (serviceMap[module.id].isAddingPass) {
                            converted_module.isAddingPass = true;
                            converted_module.newPass = serviceMap[module.id].newPass;
                        } else {
                            converted_module.isAddingPass = false;
                            converted_module.newPass = $scope.initNewPass(converted_module);
                        }

                    }
                    module = converted_module;
                    return module;
                });
            };

            $scope.convertModule = function (module) {
                var converted_module = hotelUtils.convertHotelService(module);
                converted_module.isEditingModuleInfo = false;
                converted_module.isAddingPass = false;
                converted_module.newPass = $scope.initNewPass(converted_module);
                return converted_module;
            };

            $scope.showEditHotelBox = function (hotel) {
                $scope.initCreateHotelPanel(true);
                $scope.startSpin();
                hotelService.getHotelById(hotel.id)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        data.neighborhood = data.address.neighborhood;
                        data.city = data.address.city;
                        data.fullAddress = hotelUtils.getHotelFullAddress(data);
                        var convertedHotel = hotelUtils.convertHotel(data);
                        for (var key in convertedHotel) {
                            if (key != 'services') {
                                $scope.hotel[key] = convertedHotel[key];
                            }
                        }
                        $('#image_box_hotel > .image-box img').attr('alt', hotel.name + $scope.translate('PROFILE_PICTURE'));
                        if (hotel.imageUrl) {
                            $('#image_box_hotel > .image-box img').attr('src', hotel.imageUrl);
                            $('#image_box_hotel > .image-box img').show();
                        }
                        $scope.isEditingHotel = true;
                    });
            };

            $scope.initCreateHotelPanel = function (isForEdit) {
                if (!isForEdit) {
                    $scope.hotel = {};
                }
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
                                    $scope.actionAfterSaveHotel(data);
                                });
                        } else {
                            $scope.actionAfterSaveHotel(data);
                        }
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.actionAfterSaveHotel = function (data) {
                var hotel = hotelUtils.convertHotel(data);
                for (var key in hotel) {
                    if (key != 'services') {
                        $scope.hotel[key] = hotel[key];
                    }
                }
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
                                $scope.getHotelProfile($routeParams.hotelId);
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
                            $scope.getHotelProfile($routeParams.hotelId);
                        })
                        .error(function (data, status) {
                            $scope.handleError(data);
                        });
                }, function () {

                });
            };

            $scope.showEditModuleBox = function (module) {
                $scope.startSpin();
                hotelService.getHotelServiceById(module.id)
                    .success(function () {
                        $scope.stopSpin();
                        if (module.imageUrl) {
                            $('#image_box_module_' + module.id + ' > .image-box img').attr('src', module.imageUrl);
                            $('#image_box_module_' + module.id + ' > .image-box img').show();
                        }
                        module.isEditingModuleInfo = true;
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.hideEditModuleBox = function (module) {
                module.isEditingModuleInfo = false;
            };

            $scope.discardChangeModule = function (module) {
                var pureModule = $scope.mapPureHotelService[module.id];
                for (var key in pureModule) {
                    module[key] = pureModule[key];
                }
                $scope.hideEditModuleBox(module);
                setTimeout(function () {
                    $scope.$apply();
                }, 0);
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
                $scope.stopSpin();
                // $scope.getHotelProfile($routeParams.hotelId);
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
                // $scope.initPassForm($('#new_pass_' + module.id));
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
                hotelService.createPass($scope.hotel.id, newPass.service, newPass)
                    .success(function (data, status) {
                        $scope.getPasses($scope.hotel.id).then(function () {
                            $scope.hideCreatePassBox(module);
                            $scope.stopSpin();
                        });
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.deletePass = function (pass) {
                utils.notyConfirm($scope.translate('PASS_DELETE_CONFIRM', {name: pass.title}), $scope.okText, $scope.cancelText, function () {
                    $scope.startSpin();
                    hotelService.deletePass(pass.id)
                        .success(function (data, status) {
                            $scope.getPasses($routeParams.hotelId).then(function () {
                                $scope.stopSpin();
                            });
                        })
                        .error(function (data, status) {
                            $scope.handleError(data);
                        });
                }, function () {

                });
            };

            $scope.showEditPassBox = function (pass) {
                $scope.startSpin();
                hotelService.getPassById(pass.id)
                    .success(function (data, status) {
                        var convertedPass = hotelUtils.convertPass(data);
                        for (var key in convertedPass) {
                            pass[key] = convertedPass[key];
                        }
                        setTimeout(function () {
                            pass.isEditingPassInfo = true;
                            $scope.stopSpin();
                            $scope.$apply();
                        }, 0);
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.hideEditPassBox = function (pass) {
                pass.isEditingPassInfo = false;
            };

            $scope.discardChangePass = function (pass) {
                var purePass = $scope.mapPurePass[pass.id];
                for (var key in purePass) {
                    if (pass[key] != purePass[key]) {
                        pass[key] = purePass[key];
                    }
                }
            };

            $scope.editPass = function (pass, module, $event) {
                var updatePass = $scope.isValidPass(pass, $event);
                if (!updatePass) {
                    return;
                }
                var isChangeModule = module.id != pass.service;
                $scope.startSpin();
                hotelService.updatePass(updatePass)
                    .success(function (data, status) {
                        if (isChangeModule) {
                            $scope.getPasses($scope.hotel.id).then(function () {
                                $scope.hideEditPassBox(pass);
                                $scope.stopSpin();
                            });
                        } else {
                            $scope.hideEditPassBox(pass);
                            $scope.stopSpin();
                        }
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.updatePassTitle = function (pass) {
                pass.title = hotelUtils.getPassTypeDisplay(pass.passType);
            };

            $scope.initTimePicker = function (form) {
                $(form).find('.timepicker input').timepicker({
                    showInputs: false,
                    defaultTime: false,
                    showMeridian: false,
                    showWidgetOnAddonClick: true
                });
                $(form).find('.timepicker .input-group-addon').click(function () {
                    $(this).parent().find('input').data('timepicker').showWidget();
                });


                $(form).find('.timepicker input').timepicker().on('show.timepicker', function(e) {
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

            $scope.initPassFormWithId = function (key, id) {
                var elementId = '#' + key + id;
                $scope.initPassForm($(elementId));
            };

            $scope.initPassForm = function (form) {
                $scope.initTimePicker(form);
                $(form).find('input.slider').slider();
                $(form).find("[data-mask]").inputmask();
            };

            $scope.init = function () {
                $scope.getHotelProfile($routeParams.hotelId);
            };

            $rootScope.initDipApp($scope.init);
        }]);