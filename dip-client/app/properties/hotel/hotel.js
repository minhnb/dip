'use strict';

angular.module('dipApp.properties_hotel', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/properties/hotel/:hotelId', {
            templateUrl: '/properties/hotel/hotel.html',
            controller: 'HotelProfileController'
        });
    }])
    .controller('HotelProfileController', ['$scope', '$timeout', '$rootScope', '$location', '$routeParams', 'hotelService', 'hotelUtils', 'formValidatorUtils',
        function ($scope, $timeout, $rootScope, $location, $routeParams, hotelService, hotelUtils, formValidatorUtils) {
            $rootScope.isNoMenuPage = false;
            $rootScope.pageTitle = "HOTEL_PROFILE";
            $scope.isShowingHotelProfile = false;
            $scope.isEditingHotel = false;
            $scope.isShowingCreateModule = false;
            $scope.mapHotelService = [];
            $scope.mapPureHotelService = [];
            $scope.mapPass = [];
            $scope.mapPurePass = [];

            $scope.isInitializedCreatePassForm = false;

            $scope.hotel = {};
            $scope.module = {};
            $scope.pureHotel = {};

            var endDate = config.END_DAY;
            if (endDate) {
                endDate = moment(new Date(endDate));
            }

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

            $scope.daysInWeek = [
                {
                    display: $scope.translate('WEEK_DAY_SUNDAY'),
                    displayFull: $scope.translate('WEEK_DAY_SUNDAY_FULL'),
                    value: 0
                },
                {
                    display: $scope.translate('WEEK_DAY_MONDAY'),
                    displayFull: $scope.translate('WEEK_DAY_MONDAY_FULL'),
                    value: 1
                },
                {
                    display: $scope.translate('WEEK_DAY_TUESDAY'),
                    displayFull: $scope.translate('WEEK_DAY_TUESDAY_FULL'),
                    value: 2
                },
                {
                    display: $scope.translate('WEEK_DAY_WEDNESDAY'),
                    displayFull: $scope.translate('WEEK_DAY_WEDNESDAY_FULL'),
                    value: 3
                },
                {
                    display: $scope.translate('WEEK_DAY_THURSDAY'),
                    displayFull: $scope.translate('WEEK_DAY_THURSDAY_FULL'),
                    value: 4
                },
                {
                    display: $scope.translate('WEEK_DAY_FRIDAY'),
                    displayFull: $scope.translate('WEEK_DAY_FRIDAY_FULL'),
                    value: 5
                },
                {
                    display: $scope.translate('WEEK_DAY_SATURDAY'),
                    displayFull: $scope.translate('WEEK_DAY_SATURDAY_FULL'),
                    value: 6
                }
            ];

            $scope.listPassColorPoolPass = ["#8e1113", "#cc0300", "#dd2758", "#fc558d", "#f481ad", "#ffbacb", "#f98ea2", "#f7a8a5", "#bf3b5a", "#db7457"];
            $scope.listPassColorDayBed = ["#2002ff", "#6da6f2", "#b3d7fc", "#211d7c", "#95d5e5", "#1ba7e2", "#82addd", "#9198f7", "#4176f2", "#083660"];
            $scope.listPassColorCabana = ["#93fc6a", "#62ea92", "#1ab24d", "#0d9376", "#388902", "#20e016", "#a6dd46", "#80a808", "#7efcbf", "#35fc7e"];

            $scope.getHotelById = function (hotelId) {
                return hotelService.getHotelById(hotelId)
                    .success(function (data, status) {
                        var hotel = hotelUtils.convertHotel(data);
                        utils.updateObjectInfo($scope.hotel, hotel, ['services']);
                        $scope.stopSpin();
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.getHotelProfile = function (hotelId) {
                $scope.startSpin();
                return $scope.getHotelById(hotelId)
                    .success(function (data, status) {
                        var hotel = data;
                        $scope.bindingModules(hotel.services);
                        $scope.startSpin();
                        return $scope.getPasses(hotelId).then(function () {
                            $scope.isShowingHotelProfile = true;
                            $scope.stopSpin();

                            formValidatorUtils.initDIPDefaultFormValidator($('form[name="edit-hotel"]'), $scope.editHotel);
                            formValidatorUtils.initDIPDefaultFormValidator($('form[name="create-module"]'), $scope.createModule);
                        });
                    });
            };

            $scope.getPasses = function (hotelId) {
                $scope.startSpin();
                return hotelService.getPassesByHotel(hotelId)
                    .success(function (data, status) {
                        var passes = data;
                        $scope.mapPass = [];
                        $scope.hotel.services.map(function (module) {
                            module.passes = [];
                            $scope.mapHotelService[module.id] = module;
                        });
                        passes.map(function (pass) {
                            if ($scope.mapHotelService[pass.service]) {
                                pass = hotelUtils.convertPass(pass);
                                pass.isEditingPassInfo = false;
                                $scope.mapHotelService[pass.service].passes.push(pass);
                                $scope.mapPurePass[pass.id] = Object.assign({}, pass);
                            }
                            $scope.mapPass[pass.id] = pass;
                        });
                        $scope.updatePassesMapByPassType();
                    });
            };

            $scope.updatePassesMapByPassType = function () {
                $scope.hotel.services.map(function (module) {
                    module.passesMapByPassType = [];
                    for (var i = 0; i < $scope.passTypes.length; i++) {
                        var passType = $scope.passTypes[i];
                        module.passesMapByPassType[passType.value] = [];
                    }
                });
                for (var key in $scope.mapPass) {
                    var pass = $scope.mapPass[key];
                    if ($scope.mapHotelService[pass.service]) {
                        var index = $scope.mapHotelService[pass.service].passesMapByPassType[pass.passType].length;
                        $scope.setPassColorByIndex(pass, index);
                        $scope.mapHotelService[pass.service].passesMapByPassType[pass.passType].push(pass);
                    }
                }
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
                converted_module.isMappingToCalendar = false;
                return converted_module;
            };

            $scope.showEditHotelBox = function (hotel) {
                $scope.initCreateHotelPanel(true);
                $scope.startSpin();
                hotelService.getHotelById(hotel.id)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        $('form[name="edit-hotel"]').validator('reset');
                        data.neighborhood = data.address.neighborhood;
                        data.city = data.address.city;
                        data.fullAddress = hotelUtils.getHotelFullAddress(data);
                        var convertedHotel = hotelUtils.convertHotel(data);
                        utils.updateObjectInfo($scope.hotel, convertedHotel, ['services']);
                        utils.updateObjectInfo($scope.pureHotel, convertedHotel, ['services']);
                        $('#image_box_hotel').trigger('setImage', [hotel.imageUrl, hotel.name]);
                        $scope.isEditingHotel = true;
                    });
            };

            $scope.initCreateHotelPanel = function (isForEdit) {
                if (!isForEdit) {
                    $scope.hotel = {};
                }
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

            $scope.stateSelected = function () {
                $('form[name="edit-hotel"] input[ng-model="hotel.address.state"]').trigger('change');
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
                utils.updateObjectInfo($scope.hotel, hotel, ['services']);
                $scope.stopSpin();
                $scope.isEditingHotel = false;
            };

            $scope.cancelEditHotel = function () {
                $scope.isEditingHotel = false;
                utils.updateObjectInfo($scope.hotel, $scope.pureHotel, ['services']);
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
                                hotel.submission.status = HOTEL_STATUS_PENDING;
                                hotelUtils.setHotelSubmissionStatus(hotel);
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
                                hotel.active = true;
                                hotel.submission.status = HOTEL_STATUS_APPROVED;
                                hotelUtils.setHotelActiveStatus(hotel);
                                hotelUtils.setHotelSubmissionStatus(hotel);
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
                        console.log(failReason);
                        $scope.startSpin();
                        var hotelId = hotel.id;
                        hotelService.declineHotel(hotelId, failReason)
                            .success(function (data, status) {
                                $scope.stopSpin();
                                hotel.submission.status = HOTEL_STATUS_DECLINED;
                                hotelUtils.setHotelSubmissionStatus(hotel);
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
                $('form[name="create-module"]').validator('reset');
            };

            $scope.hideCreateModuleBox = function () {
                $scope.isShowingCreateModule = false;
            };

            $scope.initCreateModulePanel = function () {
                $scope.module = {};
                $scope.module.poolType = POOL_TYPE_OTHERS;
                $('#image_box_module').trigger('clearImageBox');
            };

            $scope.updateHotelServiceImage = function (hotelServiceId) {
                var image = $('#image_box_module > .input-upload-img')[0].files[0];
                return hotelService.updateHotelServiceImage($scope.hotel.id, hotelServiceId, image)
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

            $scope.initFormValidator = function (form, focus) {
                if ($(form).length == 0) {
                    return;
                }
                if (focus == undefined) {
                    focus = false;
                }
                if (!$(form).data('bs.validator')) {
                    formValidatorUtils.initDIPFormValidatorWithAdditionalOptions(form, {focus: focus});
                }
                $(form).validator('reset');
            };

            $scope.showEditModuleBox = function (module, $event) {
                $scope.initFormValidator($($event.currentTarget).closest('.row.module-info').find('form'), true);
                $scope.startSpin();
                hotelService.getHotelServiceById(module.id)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        var convertedModule = hotelUtils.convertHotelService(data);
                        utils.updateObjectInfo(module, convertedModule, []);
                        if (!$scope.mapPureHotelService[module.id]) {
                            $scope.mapPureHotelService[module.id] = {};
                        }
                        utils.updateObjectInfo($scope.mapPureHotelService[module.id], convertedModule, []);
                        if (module.imageUrl) {
                            $('#image_box_module_' + module.id).trigger('setImage', [module.imageUrl, module.name]);
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
                utils.updateObjectInfo(module, pureModule, []);
                $scope.hideEditModuleBox(module);
                setTimeout(function () {
                    $scope.$apply();
                }, 0);
            };

            $scope.updateModuleImage = function (moduleId) {
                var image = $('#image_box_module_' + moduleId + ' > .input-upload-img')[0].files[0];
                return hotelService.updateHotelServiceImage($scope.hotel.id, moduleId, image)
                    .success(function (data, status) {

                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.editModule = function (module, $event) {
                if (!formValidatorUtils.isValidFormValidator($($event.currentTarget).closest('form'))) {
                    return;
                }
                if (!hotelUtils.isValidHotelService(module, false)) {
                    return;
                }
                $scope.startSpin();
                hotelService.updateHotelService($scope.hotel.id, module)
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
                var form = $($event.currentTarget).closest('form');
                if (!formValidatorUtils.isValidFormValidator(form)) {
                    return false;
                }
                if (!newPass.passType) {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_TYPE');
                }
                if (!newPass.title) {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_TITLE');
                }
                var startTime = $(form).find('[data-duration="start"]').data('timepicker').getTime();
                if (startTime == '') {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_DURATION_START_TIME');
                }
                var endTime = $(form).find('[data-duration="end"]').data('timepicker').getTime();
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
                var price = parseFloat($(form).find('[ng-model="pass.displayPrice"]').inputmask('unmaskedvalue'));
                if (!price) {
                    return $scope.notifyValidateError('ERROR_INVALID_PASS_PRICE');
                }
                var duration = {};
                duration.startTime = utils.convertTimeWithMeridianToDuration(startTime);
                duration.endTime = utils.convertTimeWithMeridianToDuration(endTime);
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
                newPass.description = '';
                newPass.startDay = '0000-01-01';
                newPass.dueDay = '9999-12-31';
                $scope.startSpin();
                hotelService.createPass($scope.hotel.id, newPass.service, newPass)
                    .success(function (data, status) {
                        $scope.getPasses($scope.hotel.id).then(function () {
                            if ($scope.mapHotelService[newPass.service].isMappingToCalendar) {
                                $scope.reRenderPassCalendar(newPass.service, true);
                            }
                            $scope.hideCreatePassBox(module);
                            $scope.stopSpin();
                            utils.notySuccessMessage($scope.translate('ADD_PASS_SUCCESS_PROMPT'), true);
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
                        utils.updateObjectInfo(pass, convertedPass, []);
                        if (!$scope.mapPurePass[pass.id]) {
                            $scope.mapPurePass[pass.id] = {};
                        }
                        utils.updateObjectInfo($scope.mapPurePass[pass.id], convertedPass, []);
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
                utils.updateObjectInfo(pass, purePass, []);
            };

            $scope.editPass = function (pass, module, $event) {
                var updatePass = $scope.isValidPass(pass, $event);
                if (!updatePass) {
                    return;
                }
                var isChangeModule = module.id != pass.service;
                var isChangePassType = pass.passType != $scope.mapPurePass[pass.id].passType;
                $scope.startSpin();
                hotelService.updatePass(updatePass)
                    .success(function (data, status) {
                        pass = hotelUtils.convertPass(pass);
                        if (isChangeModule) {
                            $scope.getPasses($scope.hotel.id).then(function () {
                                $scope.hideEditPassBox(pass);
                                $scope.reRenderPassCalendar(pass.service, true);
                                $scope.stopSpin();
                            });
                        } else {
                            if (isChangePassType) {
                                $scope.updatePassesMapByPassType();
                            }
                            $scope.hideEditPassBox(pass);
                            $scope.stopSpin();
                        }
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.updatePassDays = function (pass) {
                var updatePass = {
                    id: pass.id,
                    days: pass.days
                };
                $scope.startSpin();
                return hotelService.updatePass(updatePass)
                    .success(function (data, status) {
                        pass = hotelUtils.convertPass(pass);
                        $scope.stopSpin();
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.updatePassStartDayAndDueDay = function (pass) {
                var updatePass = {
                    id: pass.id,
                    startDay: pass.startDay,
                    dueDay: pass.dueDay
                };
                $scope.startSpin();
                return hotelService.updatePass(updatePass)
                    .success(function (data, status) {
                        pass = hotelUtils.convertPass(pass);
                        $scope.stopSpin();
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.needShowPassMapCalendarAndListButtons = function (module) {
                if (module.isAddingPass) {
                    return false;
                }
                if (!module.passes) {
                    return false;
                }
                for (var i = 0; i < module.passes.length; i++) {
                    if (module.passes[i].isEditingPassInfo) {
                        return false;
                    }
                }
                return true;
            };

            $scope.passMapToCalendar = function (module) {
                module.isMappingToCalendar = true;
                $scope.startSpin();
                setTimeout(function () {
                    $scope.$apply();
                    $scope.reRenderPassCalendar(module.id, true);
                    $scope.stopSpin();
                }, 0);
            };

            $scope.passShowListView = function (module) {
                module.isMappingToCalendar = false;
            };

            $scope.getPassColorClass = function (passType) {
                switch (passType) {
                    case PASS_TYPE_CABANA:
                        return 'cabana';
                    case PASS_TYPE_DAYBED:
                        return 'daybed';
                    default:
                        return 'pool-pass';
                }
            };

            $scope.setPassColorByIndex = function (pass, $index) {
                var colorArray = $scope.listPassColorPoolPass;
                switch (pass.passType) {
                    case PASS_TYPE_DAYBED:
                        colorArray = $scope.listPassColorDayBed;
                        break;
                    case PASS_TYPE_CABANA:
                        colorArray = $scope.listPassColorCabana;
                        break;
                    default:
                }
                var color = colorArray[$index % colorArray.length];
                pass.passColor = color;
            };

            $scope.displaySelectedDay = function (selectedDay) {
                if (!selectedDay) {
                    return moment(new Date()).format(FORMAT_DATE_SELECTED_DATE_CALENDAR);
                }
            };

            $scope.getDataToolTipContent = function (pass) {
                var content = $scope.getDisplayDays(pass.days);
                if (pass.displayStartDay && pass.displayDueDay) {
                    if (content) {
                        content += '<br/>';
                    }
                    content += pass.displayStartDay + ' - ' + pass.displayDueDay;
                }
                if (!content) {
                    content = $scope.translate('CLICK_TO_SET_DETAILS_FOR_PASS');
                }
                return content;
            };

            $scope.getDisplayDays = function (days) {
                days = days.slice();
                days.sort();
                var displayDays = [], current = '', i, j;
                for (i = 0; i < days.length;) {
                    current = $scope.daysInWeek[days[i]].display;
                    for (j = i + 1; j < days.length; j++) {
                        if (days[j] == days[i] + j - i) {
                            continue;
                        } else {
                            break;
                        }
                    }
                    j--;
                    if (j > i + 1) {
                        current += ' - ' + $scope.daysInWeek[days[j]].display;
                        displayDays.push(current);
                    } else if (j == i + 1) {
                        displayDays.push(current);
                        displayDays.push($scope.daysInWeek[days[j]].display);
                    } else {
                        displayDays.push(current);
                    }
                    i = j + 1;
                }
                return displayDays.join(', ');
            };

            $scope.updatePassTitle = function (pass, $event) {
                pass.title = hotelUtils.getPassTypeDisplay(pass.passType);
                setTimeout(function () {
                    var selector = '';
                    if (pass.id) {
                        selector = '#pass_' + pass.id;
                    } else {
                        selector = '#new_pass_' + pass.service;
                    }
                    $(selector).find('form input[ng-model="pass.title"]').trigger('change');
                }, 0);
            };

            $scope.initTimePicker = function (form) {
                $(form).find('.timepicker input').timepicker({
                    showInputs: false,
                    defaultTime: false,
                    // showMeridian: false,
                    showWidgetOnAddonClick: true
                });
                $(form).find('.timepicker .input-group-addon').click(function () {
                    $(this).parent().find('input').data('timepicker').showWidget();
                });


                $(form).find('.timepicker input').timepicker().on('show.timepicker', function (e) {
                    if ($(this).attr('data-duration') == 'end') {
                        var duration_start = $(this).closest('form').find('[data-duration=start]');

                        if ($(duration_start).val()) {
                            var startTime = $(duration_start).val();
                            var endTime = $(this).val();
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
                $(form).find('.timepicker input').keydown(function (e) {
                    e.preventDefault();
                });
            };

            $scope.initPassFormWithId = function (key, id) {
                var elementId = '#' + key + id;
                $scope.initPassForm($(elementId));
                $scope.initFormValidator($(elementId).find('form'), false);
            };

            $scope.initPassForm = function (form) {
                $scope.initTimePicker(form);
                $(form).find('input.slider').slider();
                $(form).find("[data-mask]").inputmask();
            };

            $scope.reRenderPassCalendar = function (moduleId, needReInit) {
                if (needReInit) {
                    $scope.initPassCalendar('#pass_calendar_' + moduleId);
                }
                $('#pass_calendar_' + moduleId).find('.pass-calendar').fullCalendar('render');
                $('#pass_calendar_' + moduleId).find('.pass-calendar').fullCalendar('refetchEvents');
            };

            $scope.initPassCalendarForm = function (calendarId) {
                // $(calendarId).find('.calendar-pass.box .box-header').tooltip({html: true});
                $(calendarId).find('.calendar-pass.box .box-header').unbind('click');
                $(calendarId).find('.calendar-pass.box .box-header').click(function (e) {
                    $(this).parent().find('> .box-body').collapse('toggle');
                    var arrowRight = 'fa-angle-right';
                    var arrowDown = 'fa-angle-down';
                    if ($(this).find('i').hasClass(arrowRight)) {
                        $(this).find('i').removeClass(arrowRight);
                        $(this).find('i').addClass(arrowDown);
                    } else {
                        $(this).find('i').removeClass(arrowDown);
                        $(this).find('i').addClass(arrowRight);
                    }
                });
                $(calendarId).find('.dip-vertical-checkbox input').iCheck({
                    checkboxClass: 'icheckbox_minimal-blue'
                });
                $(calendarId).find('.dip-vertical-checkbox input').on('ifChanged', function () {
                    var passId = $(this).data('pass-id');
                    var days = [];
                    $('#pass_calendar_content_' + passId).find('.icheckbox_minimal-blue input:checked').each(function () {
                        days.push($(this).data('day'));
                    });
                    if ($scope.mapPass[passId]) {
                        $scope.mapPass[passId].days = days;
                        $scope.updatePassDays($scope.mapPass[passId]);
                    }
                    $(calendarId).find('.pass-calendar').fullCalendar('refetchEvents');
                });
                var datePickerData = {
                    format: FORMAT_DATE_BOOTSTRAP_CALENDAR
                };
                if (endDate) {
                    datePickerData.endDate = endDate.format(FORMAT_DATE);
                }
                $(calendarId).find('input.datepicker').datepicker('destroy');
                $(calendarId).find('input.datepicker').datepicker(datePickerData);
                $(calendarId).find('input.datepicker').datepicker().off('changeDate');
                $(calendarId).find('input.datepicker').datepicker().on('changeDate', function (e) {
                    $(this).datepicker('hide');

                    var passId = $(this).data('pass-id');
                    if (!$scope.mapPass[passId]) {
                        return;
                    }
                    var startDayDatePicker = $('#pass_calendar_content_' + passId + ' input.datepicker[ng-model="pass.displayStartDay"]');
                    var dueDayDatePicker = $('#pass_calendar_content_' + passId + ' input.datepicker[ng-model="pass.displayDueDay"]');
                    var startDay = startDayDatePicker.datepicker('getDate');
                    var dueDay = dueDayDatePicker.datepicker('getDate');
                    if ($(this).attr('ng-model') == 'pass.displayStartDay') {
                        if (startDay) {
                            var dueDayDatePickerData = {};
                            utils.updateObjectInfo(dueDayDatePickerData, datePickerData, []);
                            dueDayDatePickerData.startDate = utils.formatDipDateToDate(startDay);
                            dueDayDatePicker.datepicker('destroy');
                            dueDayDatePicker.datepicker(dueDayDatePickerData);
                        }
                    }
                    if ($(this).attr('ng-model') == 'pass.displayStartDay' && !dueDay) {
                        dueDayDatePicker.focus();
                    }
                    if ($(this).attr('ng-model') == 'pass.displayDueDay' && !startDay) {
                        dueDayDatePicker.focus();
                    }
                    if (startDay && dueDay) {
                        if (startDay > dueDay) {
                            return $scope.notifyValidateError('ERROR_INVALID_PASS_START_DAY_DUE_DATE');
                        }
                        $scope.mapPass[passId].startDay = utils.formatDateToDipDate(startDay);
                        $scope.mapPass[passId].dueDay = utils.formatDateToDipDate(dueDay);
                        $scope.updatePassStartDayAndDueDay($scope.mapPass[passId]);
                        $(calendarId).find('.pass-calendar').fullCalendar('refetchEvents');
                    }
                });
            };

            $scope.initPassCalendar = function (calendarId) {
                setTimeout(function () {
                    $scope.initPassCalendarForm(calendarId);
                    $(calendarId).find('.pass-calendar').fullCalendar({
                        fixedWeekCount: false,
                        eventOrder: "order",
                        // columnFormat: 'dddd',
                        // titleFormat: FORMAT_DATE_SELECTED_DATE_CALENDAR,
                        header: {
                            center: 'title',
                            left: 'prev,next',
                            right: ''
                        },
                        defaultView: 'month',
                        events: function (start, end, timezone, callback) {
                            callback($scope.passCalendarGenerateEventSource(calendarId, start, end, timezone, this.view));
                        },
                        eventRender: function (event, element) {
                            if (event.toolTipContent) {
                                element.tooltip({
                                    title: event.toolTipContent,
                                    container: calendarId
                                });
                            }
                        },
                        viewRender: function (view, element) {
                            if (endDate) {
                                var format = 'YYYY/MM/DD';
                                if (endDate.format(format) < view.intervalEnd.format(format)) {
                                    $(calendarId + " .fc-next-button").prop('disabled', true);
                                    return false;
                                }
                                else {
                                    $(calendarId + " .fc-next-button").prop('disabled', false);
                                }
                            }
                        }
                    });
                }, 0);
            };

            $scope.passCalendarGenerateEventSource = function (calendarId, start, end, timezone, calendarView) {
                var moduleId = calendarId.replace('#pass_calendar_', '');
                $scope.mapHotelService[moduleId].passCalendar = {
                    start: start,
                    end: end,
                    timezone: timezone,
                    calendarView: calendarView
                };
                return $scope.updatePassCalendar(moduleId);
            };

            $scope.updatePassCalendar = function (moduleId) {
                if (!$scope.mapHotelService[moduleId]) {
                    console.log('module not found');
                    return;
                }
                var formatString = 'YYYY-MM-DD';
                // var passes = $scope.mapHotelService[moduleId].passes;
                var passes = [];
                for (var i = 0; i < $scope.passTypes.length; i++) {
                    var passType = $scope.passTypes[i].value;
                    var listPassByPassType = $scope.mapHotelService[moduleId].passesMapByPassType[passType];
                    if (listPassByPassType.length > 0) {
                        listPassByPassType.forEach(function (pass) {
                            passes.push(pass);
                        });
                    }
                }

                var start = $scope.mapHotelService[moduleId].passCalendar.start;
                var end = $scope.mapHotelService[moduleId].passCalendar.end;
                var timezone = $scope.mapHotelService[moduleId].passCalendar.timezone;
                var calendarView = $scope.mapHotelService[moduleId].passCalendar.calendarView;
                var listPasses = [];
                passes.forEach(function (pass) {
                    if (pass.days.length == 0) {
                        return;
                    }
                    if (pass.startDay == '0000-01-01' || pass.dueDay == '9999-12-31') {
                        return;
                    }
                    if (moment(new Date(pass.startDay)) > calendarView.intervalEnd || moment(new Date(pass.dueDay)) < calendarView.intervalStart) {
                        return;
                    }
                    listPasses.push(pass);
                });
                var eventSource = [];
                if (listPasses.length > 0) {
                    var totalDays = moment.duration(end - start).asDays();
                    for (var i = 0; i < totalDays; i++) {
                        var day = start.clone().add(i, 'days');
                        if (day < calendarView.intervalStart || day >= calendarView.intervalEnd) {
                            continue;
                        }
                        var dayInWeek = day.weekday();
                        var dayString = day.format(formatString);
                        for (var j = 0; j < listPasses.length; j++) {
                            var pass = listPasses[j];
                            var event = {
                                title: '',
                                start: dayString,
                                order: j
                            };
                            if (pass.days.indexOf(dayInWeek) > -1 && moment.utc(pass.startDay) <= day && moment.utc(pass.dueDay) >= day) {
                                event.color = pass.passColor;
                                event.toolTipContent = pass.timePeriod;
                            } else {
                                event.color = 'transparent';
                            }
                            eventSource.push(event);
                        }
                    }
                }
                return eventSource;
            };

            $scope.init = function () {
                $scope.getHotelProfile($routeParams.hotelId);
            };

            $rootScope.initDipApp($scope.init);
        }]);