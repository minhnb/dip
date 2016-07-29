var utils = {
    load_script: function (url) {
        var s = document.createElement('script');
        s.src = url;
        document.body.appendChild(s);
    },
    getObjectValueByKey: function(object, key) {
        if (!key) return null;
        let keys = key.split('.');
        let result = object[keys[0]];
        for (let i = 1; i < keys.length; i++) {
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
    formatDipDateToDate: function (dipDate) {
        return moment(dipDate).format(FORMAT_DATE);
    },
    displayMoney: function (money) {
        if (!money) return "";
        let result = Math.round(money / 100).toFixed(2);
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
            let soundName = 'alert';
            if (type == 'error') {
                soundName = 'fail';
            }
            document.getElementById('audio-' + soundName).play();
        }
        noty({text: message, layout: 'topRight', type: type, timeout: NOTY_TIME_OUT});
    },
    notySuccessMessage: function (message, hasSound) {
        this.notyMessage(message, 'success', hasSound);
    },
    notyErrorMessage: function (message, hasSound) {
        this.notyMessage(message, 'error', hasSound);
    }
};