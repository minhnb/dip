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
            convertHotel: function (hotel) {
                hotel.fullAddress = hotelUtils.getHotelFullAddress(hotel);
                if (hotel.instagram) {
                    hotel.instagramUrl = "https://www.instagram.com/" + hotel.instagram.replace('@', '');
                } else {
                    hotel.instagramUrl = "";
                }
                if (hotel.imageUrl) {
                    hotel.imageUrl = hotel.imageUrl + '_resized';
                }
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
                pass.price = pass.price/100;
                pass.startTime = utils.convertMinuteDurationToTime(pass.duration.startTime);
                pass.endTime = utils.convertMinuteDurationToTime(pass.duration.endTime);
                pass.displayStartDay = pass.startDay == '0000-01-01' ? '' : utils.formatDipDateToDate(pass.startDay);
                pass.displayDueDay = pass.dueDay == '9999-12-31' ? '' : utils.formatDipDateToDate(pass.dueDay);
                return pass;
            },
            updateEditingObject: function (editingObject, latestObject, oldObject, ignoreKeys) {
                for (var key in oldObject) {
                    if (ignoreKeys.indexOf(key) == -1) {
                        if (latestObject[key] != oldObject[key] && oldObject[key] == editingObject[key]) {
                            editingObject[key] = latestObject[key];
                        }
                    }
                }
                return editingObject;
            },
            updateEditingModule: function (editingModule, module, oldModule) {
                var ignoreKeys = ['isEditingModuleInfo', 'isAddingPass', 'newPass', 'passes'];
                return hotelUtils.updateEditingObject(editingModule, module, oldModule, ignoreKeys);
            },
            updateEditingPass: function (editingPass, pass, oldPass) {
                var ignoreKeys = ['isEditingPassInfo'];
                return hotelUtils.updateEditingObject(editingPass, pass, oldPass, ignoreKeys);
            }
        };
        return hotelUtils;
    }]);