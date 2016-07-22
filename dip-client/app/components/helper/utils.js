function load_script(url) {
    var s = document.createElement('script');
    s.src = url;
    document.body.appendChild(s);
}

function getObjectValueByKey(object, key) {
    let keys = key.split('.');
    let result = object[keys[0]];
    for (let i = 1; i < keys.length; i++) {
        result = result[keys[i]];
    }
    return result;
}

function formatTimeStampToDateTime(timestamp) {
    return moment(timestamp).format(FORMAT_DATE_TIME);
}

function convertMinuteDurationToTime(duration) {
    return moment.utc(duration * 60 * 1000).format(FORMAT_TIME_EVENT);
}

function formatDipDateToDate(dipDate) {
    return moment(dipDate).format(FORMAT_DATE);
}

function displayMoney(money) {
    if (!money) return "";
    let result = Math.round(money/100).toFixed(2);
    return "$" + result;
}

function showMessageBoxWithSound(messageBoxIdWithHashTag, soundName) {
    if (soundName) {
        document.getElementById('audio-' + soundName).play();
    }

    $(messageBoxIdWithHashTag + " .mb-control-close").on("click",function(){
        $(this).parents(".message-box").removeClass("open");
        return false;
    });
    $(messageBoxIdWithHashTag).toggleClass("open");
}