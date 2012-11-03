window.searchSession = 0;

window.getParameterByName = function(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
};

window.tedtrack = function(what, more){
    var pre = [TEDLY.user().id || 'ANON', searchSession, (new Date()).getTime(), getParameterByName("ref") || "NOREF"];
    var all = $.merge(pre, more);
    var arr = ["_trackEvent", "all", what, all.join('|'), 1];
    _gaq.push(arr);
    console.log.apply(console, arr);
};

String.prototype.toHHMMSS = function() {
    sec_numb = parseInt(this);
    var hours = Math.floor(sec_numb / 3600);
    var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
    var seconds = sec_numb - (hours * 3600) - (minutes * 60);

    if(hours < 10) {
        hours = "0" + hours;
    }
    if(minutes < 10) {
        minutes = "0" + minutes;
    }
    if(seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = hours + ':' + minutes + ':' + seconds;
    return time;
};
numberWithCommas: function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }