dipApp.directive('dipSmartValidateForm', ['$location', function ($location) {
    return {
        restrict: 'A',
        link: function ($scope, element, attrs) {
            function initSmartValidateForm() {
                $(element).find('input').keydown(function (e) {
                    var group = $(this).closest('.form-group');
                    group.find('.form-control-feedback')
                        .removeClass('glyphicon-remove')
                        .removeClass('glyphicon-ok');

                    group.find('.help-block.with-errors')
                        .each(function () {
                            var originalContent = $(this).data('bs.validator.originalContent');

                            $(this).removeData('bs.validator.originalContent')
                                .html(originalContent);
                        });

                    group.find('.has-error, .has-danger, .has-success').removeClass('has-error has-danger has-success');
                    group.removeClass('has-error has-danger has-success');

                    $(this).removeData(['bs.validator.errors', 'bs.validator.deferred'])
                        .each(function () {
                            var $this = $(this);
                            var timeout = $this.data('bs.validator.timeout');
                            window.clearTimeout(timeout) && $this.removeData('bs.validator.timeout');
                        });
                });
            }
            $(element).bind('initSmartValidateForm', initSmartValidateForm);
            setTimeout(initSmartValidateForm, 0);
        }
    };
}]);