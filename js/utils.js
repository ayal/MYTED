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
    var pre = [MYTED.user().id || 'ANON', searchSession, (new Date()).getTime(), getParameterByName("ref")];
    var all = $.merge(pre, more);
    var arr = ["_trackEvent", "all", what, all.join('|'), 1];
    _gaq.push(arr);
    console.log.apply(console, arr);
};