dipApp.factory('formValidatorUtils', [
    function () {
        var formValidatorUtils = {
            initDIPFormValidatorWithOptions: function (form, options, submitFunction) {
                $(form).validator().unbind('submit');
                $(form).validator('destroy');
                $(form).validator(options).off('focusout.bs.validator input.bs.validator')
                    .on('submit', function (e) {
                        if (submitFunction) {
                            formValidatorUtils.handleSubmitForm(e, submitFunction);
                        }
                });
                $(form).validator('reset');
            },
            initDIPDefaultFormValidator: function (form, submitFunction) {
                formValidatorUtils.initDIPFormValidatorWithOptions(form, {disable: false, delay: 0}, submitFunction);
            },
            initDIPFormValidatorWithAdditionalOptions: function (form, options, submitFunction) {
                if (options.delay == undefined) {
                    options.delay = 0;
                }
                if (options.disable == undefined) {
                    options.disable = false;
                }
                formValidatorUtils.initDIPFormValidatorWithOptions(form, options, submitFunction);
            },
            isValidFormValidator: function (form) {
               if ($(form).data('bs.validator').isIncomplete() || $(form).data('bs.validator').hasErrors()) {
                   return false;
               }
               return true;
            },
            handleSubmitForm: function (e, submitFunction) {
                var element = e.currentTarget;
                if (!formValidatorUtils.isValidFormValidator(element)) {
                    $(element).find('input[ng-model="user.confirmPassword"]').parent()
                        .find('.help-block.with-errors > ul > li').each(function (index, value) {
                        if (index > 0) {
                            $(this).remove();
                        }
                    })
                } else {
                    submitFunction();
                }
            }
        };
        return formValidatorUtils;
    }]);