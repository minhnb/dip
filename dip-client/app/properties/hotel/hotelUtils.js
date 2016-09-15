dipApp.factory('hotelUtils', [
    function () {
        var hotelUtils = {
            poolTypes: [],
            poolTypeMap: [],
            passTypes: [],
            passTypeMap: [],
            getHotelFullAddress: function (hotel) {
                var address = [hotel.address.street, hotel.address.city, hotel.address.state];
                return address.filter(Boolean).join(", ");
            },
            getInstagramUrl: function (instagram) {
                if (!instagram) {
                    return '';
                }
                var instagramOrigin = "https://www.instagram.com/";
                if (instagram[0] == '#') {
                    return instagramOrigin + 'explore/tags/' + instagram.substring(1, instagram.length);
                }
                if (instagram[0] == '@') {
                    return instagramOrigin + instagram.substring(1, instagram.length);
                }
                return instagramOrigin + instagram;
            },
            getFullUrWithProtocol: function (url) {
                if (!url) {
                    return '';
                }
                if (url.indexOf('http' == -1)) {
                    return 'http://' + url;
                }
                return url;
            },
            setHotelActiveStatus: function (hotel) {
                if (hotel.active) {
                    hotel.activeStatus = 'HOTEL_ON_AIR';
                    hotel.activeStatusClass = 'label-success';
                } else {
                    hotel.activeStatus = 'HOTEL_OFF_AIR';
                    hotel.activeStatusClass = 'label-default';
                }
            },
            setHotelSubmissionStatus: function (hotel) {
                if (hotel.submission && hotel.submission.status) {
                    switch (hotel.submission.status) {
                        case HOTEL_STATUS_INITIAL:
                            hotel.submissionStatus = 'HOTEL_STATUS_INITIAL';
                            hotel.submissionStatusClass = 'label-info';
                            break;
                        case HOTEL_STATUS_PENDING:
                            hotel.submissionStatus = 'HOTEL_STATUS_PENDING';
                            hotel.submissionStatusClass = 'label-default';
                            break;
                        case HOTEL_STATUS_APPROVED:
                            hotel.submissionStatus = 'HOTEL_STATUS_APPROVED';
                            hotel.submissionStatusClass = 'label-success';
                            break;
                        case HOTEL_STATUS_DECLINED:
                            hotel.submissionStatus = 'HOTEL_STATUS_DECLINED';
                            hotel.submissionStatusClass = 'label-danger';
                            break;
                        default:
                    }
                }
            },
            convertHotel: function (hotel) {
                hotel.fullAddress = hotelUtils.getHotelFullAddress(hotel);
                hotel.instagramUrl = hotelUtils.getInstagramUrl(hotel.instagram);
                hotel.fullUrl = hotelUtils.getFullUrWithProtocol(hotel.url);
                if (hotel.imageUrl) {
                    hotel.imageUrl = hotel.imageUrl + '_resized';
                }
                hotel.displayActive = hotel.active;
                hotelUtils.setHotelActiveStatus(hotel);
                hotelUtils.setHotelSubmissionStatus(hotel);
                return hotel;
            },
            isValidHotel: function (hotel, requiredImage, imageErrorMessage) {
                if (!hotel.name || !hotel.fullAddress) {
                    return false;
                }
                if (requiredImage && !$('#image_box_hotel > .input-upload-img').val()) {
                    utils.notyErrorMessage(imageErrorMessage, true);
                    return false;
                }
                return true;
            },
            convertHotelService: function (hotelService) {
                if (hotelService.type == MODULE_TYPE_POOL) {
                    if (!hotelService.poolType) {
                        hotelService.poolType = POOL_TYPE_OTHERS;
                    }
                    hotelService.poolTypeDisplay = this.getPoolTypeDisplay(hotelService.poolType);
                    
                }
                if (hotelService.imageUrl) {
                    hotelService.imageUrl = hotelService.imageUrl + '_resized';
                }
                return hotelService;
            },
            isValidHotelService: function (hotelService, requiredImage, imageErrorMessage) {
                if (!hotelService.name) {
                    return false;
                }
                if (requiredImage && !$('#image_box_module > .input-upload-img').val()) {
                    utils.notyErrorMessage(imageErrorMessage, true);
                    return false;
                }
                return true;
            },
            setPoolTypes: function (poolTypes) {
                this.poolTypes = poolTypes;
                poolTypes.map(function (poolType) {
                    hotelUtils.poolTypeMap[poolType.value] = poolType.display;
                });
            },
            getPoolTypeDisplay: function (poolType) {
                return this.poolTypeMap[poolType];
            },
            setPassTypes: function (passTypes) {
                this.passTypes = passTypes;
                passTypes.map(function (passType) {
                    hotelUtils.passTypeMap[passType.value] = passType.display;
                });
            },
            getPassTypeDisplay: function (passType) {
                return this.passTypeMap[passType];
            },
            getPassTimePeriod: function (duration) {
                return utils.convertMinuteDurationToTime(duration.startTime) + " - " + utils.convertMinuteDurationToTime(duration.endTime);
            },
            convertPass: function (pass) {
                pass.timePeriod = hotelUtils.getPassTimePeriod(pass.duration);
                pass.displayPrice = utils.displayMoney(pass.price);
                pass.startTime = utils.convertMinuteDurationToTime(pass.duration.startTime);
                pass.endTime = utils.convertMinuteDurationToTime(pass.duration.endTime);
                pass.displayStartDay = pass.startDay == '0000-01-01' ? '' : utils.formatDipDateToDate(pass.startDay);
                pass.displayDueDay = pass.dueDay == '9999-12-31' ? '' : utils.formatDipDateToDate(pass.dueDay);
                return pass;
            },
            updateEditingModule: function (editingModule, module, oldModule) {
                var ignoreKeys = ['isEditingModuleInfo', 'isAddingPass', 'newPass', 'passes'];
                return utils.updateEditingObject(editingModule, module, oldModule, ignoreKeys);
            },
            updateEditingPass: function (editingPass, pass, oldPass) {
                var ignoreKeys = ['isEditingPassInfo'];
                return utils.updateEditingObject(editingPass, pass, oldPass, ignoreKeys);
            }
        };
        return hotelUtils;
    }]);