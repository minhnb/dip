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
                if (requiredImage && !$('#image_create_hotel > .input-upload-img').val()) {
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
            }
        };
        return hotelUtils;
    }]);