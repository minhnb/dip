dipApp.factory('hotelUtils', [
    function () {
        var hotelUtils = {
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
            isValidHotelService: function (hotelService, requiredImage, imageErrorMessage) {
                if (!hotelService.name) {
                    return false;
                }
                if (requiredImage && !$('#image_box_module > .input-upload-img').val()) {
                    utils.notyErrorMessage(imageErrorMessage, true);
                    return false;
                }
                return true;
            }
        };
        return hotelUtils;
    }]);