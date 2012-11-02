String.prototype.toHHMMSS = function () {
    sec_numb    = parseInt(this);
    var hours   = Math.floor(sec_numb / 3600);
    var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
    var seconds = sec_numb - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
};
utils = {
    numberWithCommas:function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
};

TEDLY = {
    self: this,
    vids: [],
    init: function(cb) {
        self = this;
        var reqdef = [];
        var fetchvidspage = function(totalnumofvid) {
                for(i = 50; i < totalnumofvid; i += 50) {
                    reqdef.push($.get('http://gdata.youtube.com/feeds/api/users/TEDtalksDirector/uploads?alt=json&start-index=' + i + '&max-results=50', function(d, i) {
                        TEDLY.vids = TEDLY.vids.concat(d.feed.entry);
                    }));
                }
            };

        $.get('http://gdata.youtube.com/feeds/api/users/TEDtalksDirector/uploads?alt=json&start-index=1&max-results=50', function(d) {
            var numofpages = Math.ceil(d.feed.openSearch$totalResults.$t);
            TEDLY.vids = d.feed.entry;
            if(numofpages > 1) {
                fetchvidspage(numofpages);
                $.when.apply(null, reqdef).done(function(d) {
                    TEDLY.vids = $.map(TEDLY.vids, function(vidbox, x) {
                        return {
                            id: vidbox.id.$t.substring(vidbox.id.$t.length - 11),
                            title: vidbox.title.$t,
                            views: parseInt(vidbox.yt$statistics.viewCount, 10),
                            strviews: utils.numberWithCommas(parseInt(vidbox.yt$statistics.viewCount, 10)),
                            published: vidbox.published.$t,
                            date: new Date(vidbox.published.$t).getTime(),
                            category: vidbox.media$group.media$category[0].label,
                            // pic: vidbox.media$group.media$thumbnail[0].url,
                            pic:'http://img.youtube.com/vi/'+vidbox.id.$t.substring(vidbox.id.$t.length - 11)+'/hqdefault.jpg',

                            duration: vidbox.media$group.yt$duration.seconds.toHHMMSS()
                        };
                    });
                    // console.log(TEDLY.vids);
                    cb();
                });
            }
        });

    },
    sorty: function(bythis, vidsto) {
        vidsto = vidsto || TEDLY.vids;
        return vidsto.sort(function(a, b) {
            if(a[bythis] < b[bythis]) return 1;
            if(a[bythis] > b[bythis]) return -1;
            return 0;
        });

    },
    catfilter: function(catname, vidsarr) {
        vidsarr = vidsarr || TEDLY.vids;
        if(!vidsarr || vidsarr.length === 0) {
            return [];
        }
        return $.map(vidsarr, function(box) {
            return(box.category && box.category === catname) ? box : null;
        });

    },
    showcat: function() {
        // vidsarr = vidsarr || TEDLY.vids;
        // if (!vidsarr || vidsarr.length === 0) {
        //     return [];
        // }
        if (TEDLY.categories) {
            return TEDLY.categories;
        }
        TEDLY.categories = [];
        var temparr = [];
        TEDLY.categories = $.map(TEDLY.vids, function(box) {
            if(temparr.indexOf(box.category) === -1) {
                temparr.push(box.category);
                return {cat:box.category,pic:box.pic};
            }
            
        });
        return TEDLY.categories;
    }
};

TEDLY.init(function() {
    var context = {};
    context.title = 'Most Popular';
    context.pop = TEDLY.sorty('views');//.splice(0,TEDLY.vids.length-1);
    // context.date = TEDLY.sorty('date');
    // context.duration = TEDLY.sorty('duration');
    // context.filterbycat = TEDLY.catfilter(TEDLY.vids[0].category, TEDLY.vids);
    
    var source = $("#pop-template").html();
    var template = Handlebars.compile(source);
    var html = template(context);
    $(html).appendTo('.isowrap');
    $('#categories').click(function() {
        $('#categories,#popular').parent().toggleClass('active');
        $('.isowrap').empty();
        var source = $("#categories-template").html();
        var template = Handlebars.compile(source);
        context.categories = TEDLY.showcat();
        var html = template(context);
        $('.isowrap').empty().append(html);
    });
    $('body').on('click','.catlink',function() {
        var cat = $(this).attr('cat');
        $('.isowrap').empty();
        context.title = cat;
        context.pop =  TEDLY.sorty('views', TEDLY.catfilter(cat, TEDLY.vids));
        var source = $("#pop-template").html();
        var template = Handlebars.compile(source);
        var html = template(context);
        $(html).appendTo('.isowrap');
    });

});