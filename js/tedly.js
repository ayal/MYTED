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
utils = {
    numberWithCommas: function(x) {
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
                            pic: 'http://img.youtube.com/vi/' + vidbox.id.$t.substring(vidbox.id.$t.length - 11) + '/hqdefault.jpg',

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
        if(TEDLY.categories) {
            return TEDLY.categories;
        }
        TEDLY.categories = [];
        var temparr = [];
        TEDLY.categories = $.map(TEDLY.vids, function(box) {
            if(temparr.indexOf(box.category) === -1) {
                temparr.push(box.category);
                return {
                    cat: box.category,
                    pic: box.pic
                };
            }

        });
        return TEDLY.categories;
    }
};

TEDLY.initdef = $.Deferred().done(function() {

    $(document).ready(function() {
        console.log(TEDLY.vids);
        TedlyRouter = Backbone.Router.extend({
            routes: {
                'about': 'showabout',
                'categories': 'showcat',
                // 'categories / id': 'showflcat',
                'popular': 'showpop',
                'latest': 'showlatest',
                'watch / : id': 'getVideo',
                'search / : query': 'searchPhotos',
                '': 'showlatest'
            },
            showabout: function() {

            },
            showcat: function() {
                console.log('categories - showcat');
                var tempdata = {
                    title: 'Categories'
                };
                $('.isowrap').empty();
                var source = $("#categories-template").html();
                var template = Handlebars.compile(source);
                tempdata.categories = TEDLY.sorty('views', TEDLY.showcat());
                var html = template(tempdata);
                $('.isowrap').empty().append(html);
            },
            showflcat: function(id) {

                var catid = id;
                console.log('popular - showpop', catid);
                var tempdata = {
                    title: catid + 'on Ted',
                    pop: TEDLY.sorty('views', TEDLY.catfilter(cat, TEDLY.vids))
                };
                $('.isowrap').empty();
                var source = $("#pop-template").html();
                var template = Handlebars.compile(source);
                var html = template(tempdata);
                $('.isowrap').empty().append(html);
            },
            showpop: function() {
                console.log('popular - showpop');
                var tempdata = {
                    title: 'Popular on Ted',
                    pop: TEDLY.sorty('views', TEDLY.vids)
                };
                $('.isowrap').empty();
                var source = $("#pop-template").html();
                var template = Handlebars.compile(source);
                var html = template(tempdata);
                $('.isowrap').empty().append(html);
            },
            showlatest: function() {
                if(TEDLY.homehtml) {
                    $('.isowrap').empty().append(TEDLY.homehtml);
                    return;
                }
                console.log('showlatest');
                var tempdata = {
                    title: 'Latest on Ted',
                    pop: TEDLY.sorty('date', TEDLY.vids)
                };
                $('.isowrap').empty();
                var source = $("#pop-template").html();
                var template = Handlebars.compile(source);
                TEDLY.homehtml = template(tempdata);
                $('.isowrap').empty().append(TEDLY.homehtml);
            }

        });
    });

    var tedlyRouter = new TedlyRouter();
    Backbone.history.start({
        pushState: true
    });
    $(document).on("click", "a:not([data-bypass])", function(evt) {
        var href = {
            prop: $(this).prop("href"),
            attr: $(this).attr("href")
        };
        var root = location.protocol + "//" + location.host;

        if(href.prop && href.prop.slice(0, root.length) === root) {
            evt.preventDefault();
            Backbone.history.navigate(href.attr, true);
        }
    });
});
TEDLY.init(function() {
    TEDLY.initdef.resolve();
});