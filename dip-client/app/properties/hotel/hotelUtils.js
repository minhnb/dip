dipApp.factory('hotelUtils', [
    function () {
        var hotelUtils = {
            poolTypes: [],
            poolTypeMap: [],
            passTypes: [],
            passTypeMap: [],
            amenityTypes: [],
            amenityTypeMap: [],
            amenityTags: {},
            getHotelFullAddress: function (hotel) {
                if (!hotel.address) {
                    return '';
                }
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
            hotelHasPendingContentByKey: function (hotel, key) {
                if (!hotel.pendingContent) {
                    return false;
                }
                var value = utils.getObjectValueByKey(hotel.pendingContent, key);
                if (value == undefined || value == '' || value == null) {
                    return false;
                }
                var currentValue = utils.getObjectValueByKey(hotel, key);
                if (currentValue == value) {
                    return false;
                }
                return true;
            },
            initEmptyStringForUndefinedField: function (hotel) {
                if (!hotel.url) {
                    hotel.url = '';
                }
                if (!hotel.instagram) {
                    hotel.instagram = '';
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
                if (hotel.hasPendingContent && hotel.pendingContent) {
                    hotel.pendingContent = hotelUtils.convertHotel(hotel.pendingContent);
                }
                hotel.hasPendingContentByKey = function (key) {
                    return hotelUtils.hotelHasPendingContentByKey(hotel, key);
                };
                hotelUtils.initEmptyStringForUndefinedField(hotel);
                return hotel;
            },
            isValidHotel: function (hotel, requiredImage, imageErrorMessage) {
                if (!hotel.name || !hotel.address || !hotel.address.street || !hotel.address.city || !hotel.address.state || !hotel.address.postalCode) {
                    return false;
                }
                if (requiredImage && !$('#image_box_hotel > .input-upload-img').val()) {
                    utils.notyErrorMessage(imageErrorMessage, true);
                    return false;
                }
                return true;
            },
            createGeoQuery: function (fullAddressString, address) {
                var geoQuery = {'address': fullAddressString};
                if (address && (address.city || address.state || address.postalCode)) {
                    var componentRestrictions = {country: "US"};
                    if (address.city) {
                        componentRestrictions.locality = address.city;
                    }
                    if (address.state) {
                        componentRestrictions.administrativeArea = address.state;
                    }
                    if (address.postalCode) {
                        componentRestrictions.postalCode = address.postalCode;
                    }
                    geoQuery.componentRestrictions = componentRestrictions;
                }
                return geoQuery;
            },
            getGeoAddress: function (address_components) {
                var geoAddress = {};
                address_components.forEach(function (address_component) {
                    if (address_component.types.indexOf('street_number') > -1) {
                        geoAddress.street_number = address_component.long_name;
                        return;
                    }
                    if (address_component.types.indexOf('route') > -1) {
                        geoAddress.route = address_component.long_name;
                        return;
                    }
                    if (address_component.types.indexOf('locality') > -1) {
                        geoAddress.city = address_component.long_name;
                        return;
                    }
                    if (address_component.types.indexOf('administrative_area_level_1') > -1) {
                        geoAddress.state = address_component.short_name;
                        return;
                    }
                    if (address_component.types.indexOf('postal_code') > -1) {
                        geoAddress.postalCode = address_component.long_name;
                    }
                });
                var streets = [geoAddress.street_number, geoAddress.route];
                geoAddress.street = streets.filter(Boolean).join(' ');
                return geoAddress;
            },
            convertHotelService: function (hotelService) {
                hotelService.typeDisplay = this.getAmenityTypeDisplay(hotelService.type);
                if (hotelService.type) {
                    hotelService.amenityTags = hotelUtils.amenityTags[hotelService.type];
                }
                if (hotelService.descriptionTags) {
                    hotelService.tags = hotelService.descriptionTags.split(', ');
                }
                if (hotelService.imageUrl) {
                    hotelService.imageUrl = hotelService.imageUrl + '_resized';
                }
                return hotelService;
            },
            isValidHotelService: function (hotelService, requiredImage, imageErrorMessage) {
                if (!hotelService.name || !hotelService.type) {
                    return false;
                }
                if (hotelService.tags != undefined) {
                    hotelService.descriptionTags = hotelService.tags.filter(Boolean).join(', ');
                } else {
                    hotelService.descriptionTags = '';
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
            setAmenityTypes: function (amenityTypes) {
                this.amenityTypes = amenityTypes;
                amenityTypes.map(function (amenityType) {
                    hotelUtils.amenityTypeMap[amenityType.value] = amenityType.display;
                });
            },
            setAmenityTags: function (amenityTags) {
                this.amenityTags = amenityTags;
            },
            getPoolTypeDisplay: function (poolType) {
                return this.poolTypeMap[poolType];
            },
            getAmenityTypeDisplay: function (amenityType) {
                return this.amenityTypeMap[amenityType];
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
            getDisplayStartDay: function (startDay) {
                return startDay == '0000-01-01' ? '' : utils.formatDipDateToDate(startDay);
            },
            getDisplayDueDay: function (dueDay) {
                return dueDay == '9999-12-31' ? '' : utils.formatDipDateToDate(dueDay);
            },
            convertPass: function (pass) {
                pass.timePeriod = hotelUtils.getPassTimePeriod(pass.duration);
                pass.displayPrice = utils.displayMoney(pass.price);
                pass.startTime = utils.convertMinuteDurationToTime(pass.duration.startTime);
                pass.endTime = utils.convertMinuteDurationToTime(pass.duration.endTime);
                pass.displayStartDay = hotelUtils.getDisplayStartDay(pass.startDay);
                pass.displayDueDay = hotelUtils.getDisplayDueDay(pass.dueDay);
                return pass;
            },
            updateEditingModule: function (editingModule, module, oldModule) {
                var ignoreKeys = ['isEditingModuleInfo', 'isAddingPass', 'newPass', 'passes'];
                return utils.updateEditingObject(editingModule, module, oldModule, ignoreKeys);
            },
            updateEditingPass: function (editingPass, pass, oldPass) {
                var ignoreKeys = ['isEditingPassInfo'];
                return utils.updateEditingObject(editingPass, pass, oldPass, ignoreKeys);
            },
            getListUnusedPassColor: function (listPassColor, listUsedPassColor) {
                if (listUsedPassColor.length == 0) {
                    return listPassColor;
                }
                var listUnusedColor = [];
                listPassColor.forEach(function (color) {
                    if (listUsedPassColor.indexOf(color) == -1) {
                        listUnusedColor.push(color);
                    }
                });
                return listUnusedColor;
            },
            getRandomPassColor: function (listPassColor, listUsedPassColor) {
                var listUnusedColor = hotelUtils.getListUnusedPassColor(listPassColor, listUsedPassColor);
                var min = 0, max = listUnusedColor.length - 1;
                var random = Math.floor(Math.random() * (max - min) + min);
                var color = listUnusedColor[random];
                listUsedPassColor.push(color);
                return color;
            },
            removePassColorFromListUsedPassColor: function (passColor, listUsedPassColor) {
                var passColorIndex = listUsedPassColor.indexOf(passColor);
                if (passColorIndex > -1) {
                    listUsedPassColor.splice(passColorIndex);
                }
            }
        };
        return hotelUtils;
    }]);