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
        return moment(dipDate).format(FORMAT_DATE);
    },
    formatDateToDipDate: function (date) {
        return moment(date).format(FORMAT_DIP_DATE);
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
    }
};