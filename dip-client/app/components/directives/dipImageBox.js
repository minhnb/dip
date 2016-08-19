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
                $(element).find('.image-box-title').html(imageTitle);
                $(element).find('.image-box img').attr('alt', imageAlt);
            }

            setTimeout(initImageBox, 0);

            $scope.browseImage = function () {
                var imageBoxPreview = $(element);
                $(imageBoxPreview).find('.input-upload-img').change(function () {
                    var inputElement = this;
                    imageBoxPreview.find('.image-box > .load-image-spinner').show();

                    if ($(inputElement)[0].files && $(inputElement)[0].files[0]) {
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
                        };

                        reader.readAsDataURL($(inputElement)[0].files[0]);
                    }
                });
                $(imageBoxPreview).find('.input-upload-img').click();
            };
        }
    };
}]);