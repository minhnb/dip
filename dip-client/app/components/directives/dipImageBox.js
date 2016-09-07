dipApp.directive('dipImageBox', ['$location', function ($location) {
    return {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return '/components/dip_templates/image-box.html';
        },
        link: function ($scope, element, attrs) {
            function initImageBox() {
                var imageTitle = attrs.title || '';
                var imageAlt = attrs.alt || '';
                var imgClass = attrs.imgClass;
                var borderColor = attrs.borderCorlor || '';
                $(element).find('.image-box-title').html(imageTitle);
                $(element).find('.image-box img').attr('alt', imageAlt);
                if (borderColor) {
                    $(element).find('.image-box').css({
                       'border-color': borderColor
                    });
                }
                if (imgClass) {
                    $(element).find('.image-box img').addClass(imgClass);
                }
                $(element).find('.image-box img').load(function () {
                    $(element).find('.image-box').css({
                        'min-height': '1px'
                    });
                });
                $(element).bind('clearImageBox', function () {
                    $(element).find('.input-upload-img').val('');
                    $(element).find('.image-box img').hide();
                    $(element).find('.image-box img').attr('src', '');
                    $(element).find('.image-box').attr('title', $scope.translate('CLICK_TO_UPLOAD_PICTURE'));
                    $(element).find('.image-box').css({
                        'min-height': ''
                    });
                });
                $(element).bind('setImage', function (event, imageUrl, name) {
                    $(element).find('.image-box img').attr('alt', name + $scope.translate('PROFILE_PICTURE'));
                    if (imageUrl) {
                        $(element).find('.image-box').css({
                            'min-height': ''
                        });
                        $(element).find('.image-box img').attr('src', imageUrl);
                        $(element).find('.image-box img').show();
                        $(element).find('.image-box').attr('title', $scope.translate('CLICK_TO_CHANGE_PICTURE'));
                    }
                });
            }

            setTimeout(initImageBox, 0);

            $scope.browseImage = function () {
                var imageBoxPreview = $(element);
                $(imageBoxPreview).find('.input-upload-img').change(function () {
                    var inputElement = this;

                    if ($(inputElement)[0].files && $(inputElement)[0].files[0]) {
                        imageBoxPreview.find('.image-box > .load-image-spinner').show();
                        var maxFileSize = MAX_IMAGE_SIZE_MB * 1024 * 1024;
                        if ($(inputElement)[0].files[0].size > maxFileSize) {
                            imageBoxPreview.find('.image-box > .load-image-spinner').hide();
                            utils.notyErrorMessage($scope.translate('ERROR_MAX_FILE_SIZE', {number: MAX_IMAGE_SIZE_MB}), true);
                            inputElement.val('');
                            return;
                        }
                        var reader = new FileReader();

                        reader.onload = function (e) {
                            imageBoxPreview.find('.image-box > img').attr('src', e.target.result);
                            imageBoxPreview.find('.image-box > img').show();
                            imageBoxPreview.find('.image-box > .load-image-spinner').hide();
                            imageBoxPreview.find('.image-box').attr('title', $scope.translate('CLICK_TO_CHANGE_PICTURE'));
                        };

                        reader.readAsDataURL($(inputElement)[0].files[0]);
                    }
                });
                $(imageBoxPreview).find('.input-upload-img').click();
            };
        }
    };
}]);