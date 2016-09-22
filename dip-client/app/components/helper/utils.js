var utils = {
    load_script: function (url) {
        var s = document.createElement('script');
        s.src = url;
        document.body.appendChild(s);
    },
    getObjectValueByKey: function(object, key) {
        if (!key) return null;
        var keys = key.split('.');
        var result = object[keys[0]];
        for (var i = 1; i < keys.length; i++) {
            if (result == undefined) return null;
            result = result[keys[i]];
        }
        return result;
    },
    formatTimeStampToDateTime: function (timestamp) {
        return moment(timestamp).format(FORMAT_DATE_TIME);
    },
    convertMinuteDurationToTime: function (duration) {
        return moment.utc(duration * 60 * 1000).format(FORMAT_TIME_EVENT);
    },
    convertTimeToDuration: function (time) {
        return moment.duration(time).asMinutes();
    },
    convertTimeWithMeridianToDuration: function (time) {
        return moment.duration(moment(time, [FORMAT_TIME_EVENT]).format('HH:mm')).asMinutes();
    },
    formatDipDateToDate: function (dipDate) {
        return moment(new Date(dipDate)).format(FORMAT_DATE);
    },
    formatDateToDipDate: function (date) {
        return moment(new Date(date)).format(FORMAT_DIP_DATE);
    },
    displayMoney: function (money) {
        if (!money) return "";
        var result = (money / 100.0).toFixed(2);
        return "$" + result;
    },
    showMessageBoxWithSound: function (messageBoxIdWithHashTag, soundName) {
        if (soundName) {
            document.getElementById('audio-' + soundName).play();
        }

        $(messageBoxIdWithHashTag + " .mb-control-close").on("click", function () {
            $(this).parents(".message-box").removeClass("open");
            return false;
        });
        $(messageBoxIdWithHashTag).toggleClass("open");
    },
    notyMessage: function (message, type, hasSound) {
        if (hasSound) {
            var soundName = 'alert';
            if (type == 'error') {
                soundName = 'fail';
            }
            document.getElementById('audio-' + soundName).play();
        }
        noty({text: message, layout: 'topRight', theme: 'relax', type: type, timeout: NOTY_TIME_OUT});
    },
    notySuccessMessage: function (message, hasSound) {
        this.notyMessage(message, 'success', hasSound);
    },
    notyErrorMessage: function (message, hasSound) {
        this.notyMessage(message, 'error', hasSound);
    },
    notyConfirm: function (message, okText, cancelText, okFunction, cancelFunction) {
        noty({
            text: message,
            layout: 'center',
            theme: 'relax',
            modal: true,
            buttons: [
                {addClass: 'btn btn-info', text: okText, onClick: function($noty) {
                    $noty.close();
                    okFunction();
                }
                },
                {addClass: 'btn btn-danger', text: cancelText, onClick: function($noty) {
                    $noty.close();
                    cancelFunction();
                }
                }
            ]
        });
    },
    notyConfirmWithTextbox: function (message, okText, cancelText, okFunction, cancelFunction) {
        var formId = 'noty_form' + (new Date()).getTime();
        var template =
            '<div class="noty_message">' +
                '<span class="noty_text"></span>' +
                '<form role="form" dip-smart-validate-form id="' + formId + '">' +
                    '<div class="form-group has-feedback">' +
                        '<input type="text" class="form-control" required>' +
                        '<span class="glyphicon form-control-feedback"></span>' +
                        // '<div class="help-block with-errors"></div>' +
                    '</div>' +
                '</form>' +
                '<div class="noty_close"></div>' +
            '</div>';
        noty({
            text: message,
            layout: 'center',
            theme: 'relax',
            modal: true,
            template: template,
            buttons: [
                {addClass: 'btn btn-info', text: okText, onClick: function($noty) {
                    var form = $('form#' + formId);
                    $(form).validator('validate');
                    if ($(form).data('bs.validator').isIncomplete() || $(form).data('bs.validator').hasErrors()) {
                        return false;
                    }
                    var notyContent = $('form#' + formId + ' input:first').val();
                    $noty.close();
                    okFunction(notyContent);
                }
                },
                {addClass: 'btn btn-danger', text: cancelText, onClick: function($noty) {
                    $noty.close();
                    cancelFunction();
                }
                }
            ]
        });
        $('form#' + formId).validator({delay: 0}).off('focusout.bs.validator input.bs.validator')
            .on('submit', function (e) {
                $(this).closest('.noty_bar').find('.btn.btn-info').trigger('click');
            });
        $('form#' + formId + ' input:first').focus();

    },
    isValidEmailAddress: function (emailAddress) {
        var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
        return pattern.test(emailAddress);
    },
    copyObject: function (newInfo, ignoreKeys) {
        var temp = JSON.parse(JSON.stringify(newInfo));
        if (ignoreKeys) {
            ignoreKeys.forEach(function (item) {
                delete temp[item];
            });
        }
        return temp;
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
    }
};