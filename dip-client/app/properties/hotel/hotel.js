'use strict';

angular.module('dipApp.properties_hotel', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/properties/hotel/:hotelId', {
            templateUrl: '/properties/hotel/property-profile.html',
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
            $scope.modules = [];
            $scope.pureHotel = {};

            var endDate = config.END_DAY;
            if (endDate) {
                endDate = moment(new Date(endDate));
            }

            $scope.amenityTypes = [
                {display: $scope.translate('MODULE_TYPE_POOL'), value: MODULE_TYPE_POOL},
                {display: $scope.translate('MODULE_TYPE_SPA'), value: MODULE_TYPE_SPA},
                {display: $scope.translate('MODULE_TYPE_SALON'), value: MODULE_TYPE_SALON},
                {display: $scope.translate('MODULE_TYPE_CONFERENCE_CENTER'), value: MODULE_TYPE_CONFERENCE_CENTER},
                {display: $scope.translate('MODULE_TYPE_GYM'), value: MODULE_TYPE_GYM},
                {display: $scope.translate('MODULE_TYPE_HOTEL_ROOM'), value: MODULE_TYPE_HOTEL_ROOM}
            ];
            hotelUtils.setPoolTypes($scope.amenityTypes);

            $scope.amenityTags = [];
            $scope.amenityTags[MODULE_TYPE_POOL] = ["Lap Pool", "Olympic", "Large", "Medium", "Small", "Jacuzzi", "Indoor", "Outdoor"];
            $scope.amenityTags[MODULE_TYPE_SPA] = ["Swedish", "Deep Tissue", "Sports", "Reflexology", "Specialty"];
            $scope.amenityTags[MODULE_TYPE_SALON] = ["Salon", "Nails", "Weaves & Extensions", "Highlights", "Barber", "Color", "Special Events"];
            $scope.amenityTags[MODULE_TYPE_CONFERENCE_CENTER] = ["12+", "10", "8", "Serve Food", "Serve Drinks"];
            $scope.amenityTags[MODULE_TYPE_GYM] = [];
            $scope.amenityTags[MODULE_TYPE_HOTEL_ROOM] = [];
            hotelUtils.setAmenityTags($scope.amenityTags);

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

            $scope.listPassColor = $scope.listPassColorPoolPass.concat($scope.listPassColorDayBed).concat($scope.listPassColorCabana);
            $scope.listUsedPassColor = [];

            $scope.getHotelById = function (hotelId) {
                return hotelService.getHotelById(hotelId)
                    .success(function (data, status) {
                        var hotel = hotelUtils.convertHotel(data);
                        $scope.hotel = utils.copyObject(hotel, ['services']);
                        $scope.pureHotel = utils.copyObject(hotel, ['services']);
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
                        return $scope.getPasses(hotelId)
                            .success(function (data, status) {
                                $scope.isShowingHotelProfile = true;
                                $scope.stopSpin();

                                formValidatorUtils.initDIPDefaultFormValidator($('form[name="edit-hotel"]'), $scope.editHotel);
                                $('#image_box_hotel').trigger('setImage', [hotel.imageUrl, hotel.name]);
                                $('form[name="edit-hotel"]').change(function () {
                                    $scope.isEditingHotel = true;
                                    setTimeout(function () {
                                        $scope.$apply();
                                    }, 0);
                                });
                                $scope.initCalendarFullModules();
                            });
                    });
            };

            $scope.getPasses = function (hotelId) {
                $scope.startSpin();
                return hotelService.getPassesByHotel(hotelId)
                    .success(function (data, status) {
                        var passes = data;
                        $scope.mapPass = [];
                        $scope.modules.map(function (module) {
                            module.passes = [];
                            $scope.mapHotelService[module.id] = module;
                        });
                        passes.map(function (pass) {
                            if ($scope.mapHotelService[pass.service]) {
                                pass = hotelUtils.convertPass(pass);
                                pass.passColor = hotelUtils.getRandomPassColor($scope.listPassColor, $scope.listUsedPassColor);
                                pass.isEditingPassInfo = false;
                                $scope.mapHotelService[pass.service].passes.push(pass);
                                $scope.mapPurePass[pass.id] = utils.copyObject(pass);
                                $scope.mapPass[pass.id] = pass;
                            }
                        });
                        // $scope.updatePassesMapByPassType();
                    });
            };

            $scope.updatePassesMapByPassType = function () {
                $scope.modules.map(function (module) {
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
                if ($scope.modules.length > 0) {
                    $scope.modules.map(function (module) {
                        serviceMap[module.id] = module;
                    });
                } else {
                    $scope.modules = services.map(function (module) {
                        var converted_module = $scope.convertModule(module);
                        $scope.mapPureHotelService[module.id] = utils.copyObject(converted_module);
                        return converted_module;
                    });
                    return;
                }
                $scope.modules = services.map(function (module) {
                    var converted_module = $scope.convertModule(module);
                    if (serviceMap[module.id]) {
                        var pureModule = utils.copyObject($scope.mapPureHotelService[module.id]);
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

                    } else {
                        $scope.mapPureHotelService[module.id] = utils.copyObject(converted_module);
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

                        $scope.hotel = utils.copyObject(convertedHotel, ['services']);
                        $scope.pureHotel = utils.copyObject(convertedHotel, ['services']);
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
                $scope.hotel = utils.copyObject(hotel, ['services']);
                $scope.pureHotel = utils.copyObject(hotel, ['services']);
                $scope.stopSpin();
                $scope.isEditingHotel = false;
                $('form[name="edit-hotel"]').validator('reset');
            };

            $scope.cancelEditHotel = function () {
                $scope.isEditingHotel = false;
                $('form[name="edit-hotel"]').validator('reset');
                $scope.hotel = utils.copyObject($scope.pureHotel, ['services']);
                if ($scope.hotel.imageUrl) {
                    $('#image_box_hotel').trigger('setImage', [$scope.hotel.imageUrl, $scope.hotel.name]);
                } else {
                    $('#image_box_hotel').trigger('clearImageBox');
                }
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
            };

            $scope.hideCreateModuleBox = function () {
                $scope.isShowingCreateModule = false;
                $('form[name="create-module"]').closest('.calendar-pass').find('> .box-header').trigger('click');
            };

            $scope.initCreateModulePanel = function () {
                $scope.module = {};
                $scope.module.poolType = POOL_TYPE_OTHERS;
                $('#image_box_module').trigger('clearImageBox');
                $('form[name="create-module"]').validator('reset');
            };

            $scope.amenityTypeSelected = function (module) {
                if (module.amenityTags != $scope.amenityTags[module.type]) {
                    module.amenityTags = $scope.amenityTags[module.type];
                    module.tags = [];
                }
                var formSelector = 'form[name="create-module"]';
                if (module.id) {
                    formSelector = 'form[name="edit-module"]#module_form_' + module.id;
                }
                $(formSelector + ' input[ng-model="module.type"]').trigger('change');
            };

            $scope.initClassForModuleInfoCollapse = function (module) {
                if (module.passes && module.passes.length > 0) {
                    module.isShowingDetails = false;
                    return '';
                }
                module.isShowingDetails = true;
                return 'in';
            };

            $scope.findObjectIndexById = function (list, objectId) {
                for (var i = 0; i < list.length; i++) {
                    var module = list[i];
                    if (objectId == module.id) {
                        return i;
                    }
                }
                return -1;
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
                            .success(function (data, status) {
                                $scope.hideCreateModuleBox();
                                $scope.module = {};
                                $('form[name="create-module"]').validator('reset');
                                $('#image_box_module').trigger('clearImageBox');

                                $scope.stopSpin();
                                var module = $scope.convertModule(data);
                                $scope.mapPureHotelService[module.id] = utils.copyObject(module);
                                module.passes = [];
                                $scope.modules.push(module);
                                $scope.mapHotelService[module.id] = module;
                                $scope.initCalendarFullModules();
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
                            delete $scope.mapHotelService[module.id];
                            delete $scope.mapPureHotelService[module.id];
                            module.passes.map(function (pass) {
                                hotelUtils.removePassColorFromListUsedPassColor(pass.passColor, $scope.listUsedPassColor);
                                delete $scope.mapPass[pass.id];
                                delete $scope.mapPurePass[pass.id];
                            });
                            var moduleIndex = $scope.findObjectIndexById($scope.modules, module.id);
                            if (moduleIndex > -1) {
                                $scope.modules.splice(moduleIndex, 1);
                            }
                            $scope.refetchCalendarFullModules();
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
                        module = utils.copyObject(convertedModule);
                        if (!$scope.mapPureHotelService[module.id]) {
                            $scope.mapPureHotelService[module.id] = {};
                        }
                        $scope.mapPureHotelService[module.id] = utils.copyObject(convertedModule);
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
                $('form[name="edit-module"]#module_form_' + module.id).validator('reset');
            };

            $scope.discardChangeModule = function (module) {
                var pureModule = $scope.mapPureHotelService[module.id];
                utils.updateObjectInfo(module, pureModule, ['passes']);
                $('#image_box_module_' + module.id).trigger('setImage', [module.imageUrl, module.name]);
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
                                    $scope.actionAfterSaveModule(module, data);
                                });
                        } else {
                            $scope.actionAfterSaveModule(module, data);
                        }
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.actionAfterSaveModule = function (module, data) {
                var converted_module = $scope.convertModule(data);
                utils.updateObjectInfo(module, converted_module, ['passes']);
                $scope.mapPureHotelService[module.id] = utils.copyObject(converted_module);
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
                // if (duration.startTime >= duration.endTime) {
                //     return $scope.notifyValidateError('ERROR_INVALID_PASS_DURATION');
                // }
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
                        $scope.hideCreatePassBox(module);
                        // utils.notySuccessMessage($scope.translate('ADD_PASS_SUCCESS_PROMPT'), true);

                        $scope.stopSpin();
                        var moduleIndex = $scope.findObjectIndexById($scope.modules, data.service);
                        if (moduleIndex > -1) {
                            var convertedPass = hotelUtils.convertPass(data);
                            convertedPass.passColor = hotelUtils.getRandomPassColor($scope.listPassColor, $scope.listUsedPassColor);
                            convertedPass.isEditingPassInfo = false;
                            $scope.mapPurePass[data.id] = utils.copyObject(convertedPass);
                            $scope.mapPass[data.id] = convertedPass;

                            $scope.modules[moduleIndex].passes.push($scope.mapPass[data.id]);
                            // $scope.mapHotelService[pass.service] = $scope.modules[moduleIndex];
                            $scope.initCalendarFullModules();
                        }
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
                            $scope.stopSpin();
                            var moduleIndex = $scope.findObjectIndexById($scope.modules, pass.service);
                            if (moduleIndex > -1) {
                                hotelUtils.removePassColorFromListUsedPassColor(pass.passColor, $scope.listUsedPassColor);
                                var passes = $scope.modules[moduleIndex].passes;
                                var passIndex = $scope.findObjectIndexById(passes, pass.id);
                                if (passIndex > -1) {
                                    passes.splice(passIndex, 1);
                                }
                                delete $scope.mapPurePass[pass.id];
                                delete $scope.mapPass[pass.id];

                                $scope.refetchCalendarFullModules();
                            }

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
                        pass = utils.copyObject(convertedPass);
                        if (!$scope.mapPurePass[pass.id]) {
                            $scope.mapPurePass[pass.id] = {};
                        }
                        $scope.mapPurePass[pass.id] = utils.copyObject(convertedPass);
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
                utils.updateObjectInfo(pass, purePass, ['displayStartDay', 'displayDueDay', 'daysInWeek']);
                $('#pass_' + pass.id).find('form').validator('reset');
                $('#pass_' + pass.id).find('input[ng-model="pass.allotmentCount"]').closest('.slider').slider('setValue', pass.allotmentCount);
                $('#pass_' + pass.id).find('input[ng-model="pass.capacity"]').closest('.slider').slider('setValue', pass.capacity);
                $('#pass_' + pass.id).find('input[ng-model="pass.displayPrice"]').val(pass.displayPrice);
                $('#pass_' + pass.id).find('input[ng-model="pass.startTime"]').val(pass.startTime);
                $('#pass_' + pass.id).find('input[ng-model="pass.endTime"]').val(pass.endTime);
                $scope.hideEditPassBox(pass);
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
                        var convertedPass = hotelUtils.convertPass(pass);
                        utils.updateObjectInfo(pass, convertedPass);
                        $scope.mapPurePass[pass.id] = convertedPass;
                        $scope.hideEditPassBox(pass);
                        $('#pass_' + pass.id).validator('reset');
                        $scope.initCalendarFullModules();
                        $scope.refetchCalendarFullModules();
                        $scope.stopSpin();
                        return;
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
                        pass.days = data.days;
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
                        pass.startDay = data.startDay;
                        pass.dueDay = data.dueDay;
                        pass.displayStartDay = hotelUtils.getDisplayStartDay(pass.startDay);
                        pass.displayDueDay = hotelUtils.getDisplayDueDay(pass.dueDay);
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
                    $(selector).find('form input[ng-model="pass.title"], [ng-model="pass.passType"]').trigger('change');
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

            $scope.initPassFormWithId = function (key, id, isExisting) {
                var elementId = '#' + key + id;
                $scope.initPassForm($(elementId));
                $scope.initFormValidator($(elementId).find('form'), false);
                if (isExisting) {
                    $(elementId).find('form').change(function () {
                        var pass = $scope.mapPass[id];
                        pass.isEditingPassInfo = true;
                        setTimeout(function () {
                            $scope.$apply();
                        }, 0);
                    });
                }
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
                    if ($(this).find('i').hasClass('fa-plus')) {
                        return;
                    }
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
                            dueDayDatePickerData = utils.copyObject(datePickerData);
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

            $scope.initCalendarView = function (calendarId, isFullModules) {
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
                        if (isFullModules) {
                            callback($scope.updatePassesForFullCalendar(start, end, timezone, this.view));
                        } else {
                            callback($scope.passCalendarGenerateEventSource(calendarId, start, end, timezone, this.view));
                        }
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
                var height = $(calendarId).find('.pass-calendar').height();
                $(calendarId).find('.left-side-bar').height(height);
            };

            $scope.initPassCalendar = function (calendarId, isFullModules) {
                setTimeout(function () {
                    $scope.initPassCalendarForm(calendarId);
                    $scope.initCalendarView(calendarId, isFullModules);
                }, 0);
            };

            $scope.initCalendarFullModules = function () {
                var calendarId = '#calendar_full_modules';
                $scope.initPassCalendar(calendarId, true);
                setTimeout(function () {
                    $scope.initModuleForm();
                }, 0);
            };

            $scope.refetchCalendarFullModules = function () {
                $('#calendar_full_modules .pass-calendar').fullCalendar('refetchEvents');
            };

            $scope.initModuleForm = function () {
                formValidatorUtils.initDIPDefaultFormValidator($('form[name="create-module"]'), $scope.createModule);
                $scope.modules.map(function (module) {
                    var formSelector = 'form[name="edit-module"]#module_form_' + module.id;
                    $scope.initFormValidator($(formSelector), true);
                    $(formSelector).change(function () {
                        module.isEditingModuleInfo = true;
                        setTimeout(function () {
                            $scope.$apply();
                        }, 0);
                    });
                });
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

                return $scope.updatePassesToCalendar(passes, start, end, timezone, calendarView);
            };

            $scope.updatePassesForFullCalendar = function (start, end, timezone, calendarView) {
                var passes = [];
                for (var key in $scope.mapPass) {
                    passes.push($scope.mapPass[key]);
                }
                return $scope.updatePassesToCalendar(passes, start, end, timezone, calendarView);
            };

            $scope.updatePassesToCalendar = function (passes, start, end, timezone, calendarView) {
                var formatString = 'YYYY-MM-DD';
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