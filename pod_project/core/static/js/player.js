/*
Copyright (C) 2014 Nicolas Can
Ce programme est un logiciel libre : vous pouvez
le redistribuer et/ou le modifier sous les termes
de la licence GNU Public Licence telle que publiée
par la Free Software Foundation, soit dans la
version 3 de la licence, ou (selon votre choix)
toute version ultérieure. 
Ce programme est distribué avec l'espoir
qu'il sera utile, mais SANS AUCUNE
GARANTIE : sans même les garanties
implicites de VALEUR MARCHANDE ou
D'APPLICABILITÉ À UN BUT PRÉCIS. Voir
la licence GNU General Public License
pour plus de détails.
Vous devriez avoir reçu une copie de la licence
GNU General Public Licence
avec ce programme. Si ce n'est pas le cas,
voir http://www.gnu.org/licenses/
*/
/******* VARIABLES ********/
var myPlayer;
var currentslide = '';
var timestamps = [];
var changeRes = false;
var animation_complete = true;
var list_disp = {
    '50/50': '50/50',
    '30/70': '30/70',
    '70/30': '70/30',
    '100/20': 'Pip media',
    '20/100': 'Pip video',
    '100/0': 'only video',
    '0/100': 'only media'
};
var defaultDisp = '50/50';
var slide_height = 90; //96 en fullscreen
var videozindex = 1000;
var isPlaying = false;
var increase_view_count = false;
var start;
/* check bandwidth */
var previoustime = 0;
var previousuploaded = 0;
var mediumspeed = 0;
var intcheck = 0;
var changeResBd = false;
/******* DOC READY ********/
$(document).ready(function() {
    loadVideo();
    // Remove right click on video
    $('#player_video').bind('contextmenu', function() { return false; });
});

/******* FUNCTION ********/
function loadVideo() {
    //reinitialize somes var :
    currentslide = '';
    timestamps = [];
    
    videojs.options.flash.swf = 'video-js.swf';
    videojs('player_video').ready(function() {
        // PLAYER READY
        myPlayer = this;

        myPlayer.on('loadstart', loadstart);
        myPlayer.on('loadedmetadata', loadedmetadata);
        myPlayer.on('error', error); // error log for dev
        myPlayer.on('durationchange', loadChapBar);
        myPlayer.on('progress', progress);
        myPlayer.on('timeupdate', timeupdate);
         myPlayer.on('firstplay', function(){
            $.post(
                location,
                {
                    action: 'increase_view_count'
                },
                function(data) {
                }
            );
        });
        myPlayer.on('fullscreenchange', function() {
            if ($('#player_video').hasClass('vjs-fullscreen')) {
                slide_height = 96;
                $('.vjs-slide').height( '96%' );
                $('.vjs-title').css('font-size', '8em');
            } else {
                slide_height = 90;
                $('.vjs-slide').height( '90%' );
                $('.vjs-title').css('font-size', '3em');
            }
        });

        // Load plugin
        var defsize = decodeURIComponent($.urlParam('size'));
        if (defsize != '480' && defsize != '720') {
            defsize = 240;
        }
        myPlayer.resolutionSelector({default_res : ''+defsize});

        if ($('ul#slides li[data-type!="None"]').length > 0) {
            myPlayer.displaySelector({
                default_disp: '100/0',
			    list_disp: list_disp
			});
        }
        $('ul#slides').hide();

        if ($('ul#chapters li').length > 0) {
            var list_chap = {};
            $('ul#chapters li').each(function () {
                list_chap[$(this).attr('data-start')] = $(this).attr('data-title');
            });
            myPlayer.chapterSelector({
    			list_chap : list_chap
			});
			$('ul#chapters').hide();
        }
        
        $('div.vjs-slide').hide();
        $('div.vjs-title').hide();
        
        myPlayer.on('changeRes', function() {
            changeRes = true;
        });
        myPlayer.on('changeDisp', function() {
            isPlaying = !myPlayer.paused();
            changeDisplay(myPlayer.getCurrentDisp());
        });
        
        // LOAD Z-INDEX
        $('video').css('zIndex', videozindex + 1);
        $('.vjs-slide').css('zIndex', videozindex + 2);
        $('.vjs-title').css('zIndex', videozindex + 3);
        $('.vjs-big-play-button').css('zIndex', videozindex + 5);
        $('.vjs-loading-spinner').css('zIndex', videozindex + 6);
        $('.vjs-text-track-display').css('zIndex', videozindex + 7);
        $('.vjs-control-bar').css('zIndex', videozindex + 8);

        var IS_MOBILE = /mobile|android/i.test (navigator.userAgent);
        var IS_IPHONE = (/iPhone/i).test(navigator.userAgent);
        var IS_IPAD = (/iPad/i).test(navigator.userAgent);
        var IS_IPOD = (/iPod/i).test(navigator.userAgent);
        var IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;
        var IS_ANDROID = (/Android/i).test(navigator.userAgent);
        /*************************************************************************/
        if (is_iframe === true) {
            $('div#info_video')
                .appendTo($('#player_video'))
                .attr(
                    'style',
                    'z-index: ' + (videozindex + 3) + ';' +
                    'position: absolute;' +
                    'top: 10%;' +
                    'left: 10%;' +
                    'width: 80%;' +
                    'height: 80%;' +
                    'background-color: #fff;'
                )
                .hide();
            $('#player')
                .css('padding', 0)
                .css('overflow', 'hidden');
            $('body').attr('style', 'margin: 0;padding: 0;overflow: hidden;');
            $('#player_video').attr('style', 'position:absolute; top:0; left:0; width:100%; height:100%');
            $('#page-video')
                .height('100%')
                .css('overflow', 'hidden');
            $('.vjs-big-play-button').css('zIndex', videozindex + 4);
            videojs.Info = videojs.Button.extend({
                /** @constructor */
                init: function(player, options) {
                    videojs.Button.call(this, player, options);
                    this.on('click', this.onClick);
                }
            });

            videojs.Info.prototype.onClick = function() {
                if ($('div#info_video').is(':visible')) {
                    $('div#info_video').hide();
                } else { 
                    $('div#info_video').show();
                }
            };

            // Note that we're not doing this in prototype.createEl() because
            // it won't be called by Component.init (due to name obfuscation).
            var createInfoButton = function() {
                var props = {
                    className: 'vjs-info-button vjs-control',
                    innerHTML: '<div class="vjs-control-content"><span class="vjs-control-text">' + ('Info') + '</span></div>',
                    role: 'button',
                    'aria-live': 'polite', // let the screen reader user know that the text of the button may change
                    tabIndex: 0
                  };
                return videojs.Component.prototype.createEl(null, props);
            };

            var info;
            videojs.plugin('info', function() {
                var options = {'el': createInfoButton()};
                info = new videojs.Info(this, options);
                this.controlBar.el().appendChild(info.el());
            });

            myPlayer.info({});
        }
        /*************************************************************************/        
        if (IS_MOBILE) {
            if (is_iframe === false && ($('ul#slides li[data-type!="None"]').length > 0 || $('ul#chapters li').length > 0)) {
                $('#player').after('<nav class="navbar navbar-default" role="navigation"><div class="collapse navbar-collapse" ><ul class="nav navbar-nav" id="mobile_info"></ul></div></nav>');
                if ($('ul#slides li[data-type!="None"]').length > 0) {
                    var disp_html = '<li id="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Display <b class="caret"></b></a><ul id="mobile_disp" class="dropdown-menu">';
                    for (var disp in list_disp) {
                        disp_html += '<li><a href="#'+disp+'">'+list_disp[disp]+'</a></li>';
                    }
                    disp_html += '</ul></li>';
                    $('#mobile_info').append(disp_html);

                    $('#mobile_disp a').click(function(e) {
                        e.preventDefault();
                        $('#mobile_disp a').removeClass();
                        $(this).addClass('current');
                        myPlayer.currentDisp = $(this).attr('href').replace('#', '');
                        changeDisplay($(this).attr('href').replace('#', ''));
                    });
                }
                if ($('ul#chapters li').length > 0) {
                    var chap_html = '<li id="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Chapter(s) <b class="caret"></b></a><ul id="mobile_chap" class="dropdown-menu">';
                    for (var chap in list_chap) {
                        chap_html += '<li><a href="#'+chap+'" >'+list_chap[chap]+'</a></li>';
                    }
                    chap_html += '</ul></li>';
                    $('#mobile_info').append(chap_html);
                    $('#mobile_chap a').click(function(e) {
                        e.preventDefault();
                        $('#mobile_chap a').removeClass();
                        $(this).addClass('current');
                        myPlayer.currentTime($(this).attr('href').replace('#', ''));
                    });
                }
            }
        } else {
            // On a ajoute l'overview
            if ($('.vjs-control-bar').length && overview && overview != '') {
                // Not using jquery to improve perf
                $('.vjs-control-bar').append(
                    '<div id="preview" hidden style="display:none;">' +
                        '<img src="' + overview + '" id="previewimg" style="position:absolute" />' +
                    '</div>'
                );
                $('#preview').css('zIndex', videozindex + 5);
                var pre = $('#preview').get(0);
                var preimg = $('#previewimg').get(0);
                pre.style.width = (overview_width / 100) + 'px';
                pre.style.height = overview_height + 'px';
                pre.style.top = 0 - ($('.vjs-control-bar').height() + $( '#preview' ).height()) + 'px';
                preimg.style.top = '0px';
                var progressControl = myPlayer.controlBar.progressControl;

                $('.vjs-progress-holder').mousemove(function(event) {
                    left = event.pageX || (event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft);
                    // Subtract the page offset of the progress control
                    left -= progressControl.el().getBoundingClientRect().left + window.pageXOffset;
                    percent  = (left / progressControl.el().getBoundingClientRect().width) * 100;

                    left = left - (pre.offsetWidth / 2);

                    if (left < 0) {
                        left = 0;
                    } else if (left > (progressControl.el().getBoundingClientRect().width - pre.offsetWidth)) {
                        left = progressControl.el().getBoundingClientRect().width - pre.offsetWidth;
                    }
                    pre.style.left = left + 'px';
                    preimg.style.left = '-' + parseInt(percent) * overview_width / 100 + 'px';
                });
                $('.vjs-progress-holder').mouseenter(function(event) {
                    pre.hidden = false;
                    pre.style.display = 'block';
                });
                $('.vjs-progress-holder').mouseleave(function(event) {
                    pre.hidden = true;
                    pre.style.display = 'none';
                });
            }
        }
        /*************************************************************************/
        if (logo_player != '') {
            var elem = document.createElement('img');
            elem.setAttribute('src', logo_player);
            elem.setAttribute('height', '90%');
            elem.setAttribute('alt', 'Flower');
            myPlayer.controlBar.el().appendChild(elem);
        }
        /*************************************************************************/
        start = decodeURIComponent($.urlParam('start'));
    });
}

function changeDisplay(disp, duration) {
    duration = (typeof duration == 'undefined' ? 500 : duration);
    vid_width = parseInt(disp.split('/')[0]);
    slide_width = parseInt(disp.split('/')[1]);
    
    if (animation_complete === true) {
        animation_complete = false;
        if (vid_width == 100 && slide_width > 0) {
            $('video').css('zIndex', videozindex + 1);
            $('.vjs-slide').css('zIndex', videozindex + 2);

            $('.video-js .vjs-tech').animate(
                {
                    width: vid_width + '%',
                    height: '100%',
                    left: '0%'
                },
                duration
            );
            $('.video-js .vjs-slide').animate(
                {
                    width: slide_width + '%',
                    height: slide_width + '%',
                    left: (100 - slide_width) + '%'
                },
                duration,
                function() {
                    animation_complete = true;
                    if($('.vjs-slide article img').length) {
                        var top = parseInt(($('.vjs-slide article').height()-$('.vjs-slide article img').height())/2);
                        $('.vjs-slide article img').attr("style","top:"+top+"px;position:relative;");
                    }
                }
            );
        } else {
            if (slide_width == 100 && vid_width > 0) {
                $('video').css('zIndex', videozindex + 2);
                $('.vjs-slide').css('zIndex', videozindex + 1);
                $('.video-js .vjs-tech').animate(
                    {
                        width: vid_width + '%',
                        height: vid_width + '%',
                        left: '0%'
                    },
                    duration
                );
                $('.video-js .vjs-slide').animate(
                    {
                        width: slide_width + '%',
                        height: slide_height + '%',
                        left: (100 - slide_width) + '%'
                    },
                    duration,function() {
                        animation_complete = true;
                        if($('.vjs-slide article img').length) {
                            var top = parseInt(($('.vjs-slide article').height()-$('.vjs-slide article img').height())/2);
                            $('.vjs-slide article img').attr("style","top:"+top+"px;position:relative;");
                        }
                    }
                );
            } else {
                $('.video-js .vjs-tech').animate(
                    {
                        width: vid_width + '%',
                        height: '100%',
                        left: '0%'
                    },
                    duration
                );
                $('.video-js .vjs-slide').animate(
                    {
                        width: slide_width + '%',
                        height: slide_height + '%',
                        left: (100 - slide_width) + '%'
                    },
                    duration,
                    function() {
                        animation_complete = true;
                        if($('.vjs-slide article img').length) {
                            var top = parseInt(($('.vjs-slide article').height()-$('.vjs-slide article img').height())/2);
                            $('.vjs-slide article img').attr("style","top:"+top+"px;position:relative;");
                        }
                    }
                );
            }
        }
        if (isPlaying) {
            myPlayer.play();
        } else {
            myPlayer.pause();
        }
    }
}

$(document).on(
    'click',
    'button#button_video_note',
    function (event) {
        event.preventDefault();
        if (expiration_date_second > 5) {
            var jqxhr = $.post(
                $( '#video_note_form' ).attr('action'),
                $( '#video_note_form' ).serialize(),
                function(data) {
                    var alert_text =
                        '<div class="alert alert-info" id="myAlert">' +
                            '<a href="#" class="close" data-dismiss="alert">&times;</a>' +
                            data +
                        '</div>';
                    $('body').append(alert_text);
                    $('#myAlert').on('closed.bs.alert', function () {
                        $(this).remove();
                    });
                    $('#myAlert').alert();
                    window.setTimeout(function() { $('#myAlert').alert('close'); }, 3000);
                }
            );
            jqxhr.fail(function(data) {
                alert('Error '+data);
            });
        } else {
            alert(expiredsession);
            location.reload();
        }
    }
);

function timeupdate(event) {
    var t = myPlayer.currentTime();
    var all = timestamps.length;
    var slide = false;
    var change_slide = false;
    var current_slide_type = 'None';

    var i = 0;
    for (i; i < all; i++) {
        if (t >= timestamps[i].start && t <= timestamps[i].end) {
            slide = true;

            if (currentslide != $(timestamps[i].elm).attr('data-id')) {
                if ($(timestamps[i].elm).data('stop-video') == 'True') {
                    myPlayer.pause();
                }
                isPlaying = !myPlayer.paused();
                
                if ($(timestamps[i].elm).data('type') != 'None') {
                    if(!$('.vjs-slide').is(':visible')) {
                        $('.vjs-slide').show();
                        // performClick
                        $('div.vjs-disp-button').find('li.vjs-menu-item:contains(' + defaultDisp + ')').trigger('click');
                        if ((myPlayer.currentDisp == defaultDisp) == false) {
                            myPlayer.currentDisp = defaultDisp;
                            changeDisplay(defaultDisp);
                        }
                    }
                }

                timestamps[i].elm.addClass('current');
                change_slide = true;
                currentslide = $(timestamps[i].elm).attr('data-id');
                current_slide_type = $(timestamps[i].elm).attr('data-type');
                $('.vjs-slide').html('&nbsp;');
                if (current_slide_type != 'None') {
                    var noscriptContents = $($(timestamps[i].elm).find('noscript').text());
                    $('.vjs-slide').html('<article>&nbsp;</article>');
                    $('.vjs-slide article').append(noscriptContents);
                }

                // Show title on overlay
                $('.vjs-title')
                    .text($(timestamps[i].elm).attr('data-title'))
                    .fadeIn('slow')
                    .delay(3000)
                    .fadeOut('slow');
                break;
            }
        } else {
            timestamps[i].elm.removeClass('current');
        }
    }

    if (slide == true && change_slide == true ) {
        isPlaying = !myPlayer.paused();
        if (current_slide_type != 'None') {
            changeDisplay(myPlayer.getCurrentDisp(), 1000);
        } else {
            changeDisplay('100/0');
        }
    } 
    if (currentslide != '' && slide == false ){
        for (i = 0; i < all; i++) {
            if (t < timestamps[i].start) {
                break;
            }
        }
        isPlaying = !myPlayer.paused();
        currentslide = '';
        $('.vjs-slide').html('&nbsp;');
        $('.vjs-title').text('').hide();
        if (i == all || timestamps[i].start-parseInt(t) > 2) {
            changeDisplay('100/0', 1000);
        }
    }
    
}

$.urlParam = function(name) {
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null){
       return null;
    } else {
       return results[1] || 0;
    }
};

function loadstart() {
    if (changeRes == true) {
        changeRes = false;
        myPlayer.play();
    } else {
        if (start && start != 'null' && start !=0) {
            myPlayer.play();
        } else if (typeof is_chaptering != 'undefined' && is_chaptering == true) {
            myPlayer.play();
        }
    }
}

function loadedmetadata() {
    if (changeRes == false && start && start != 'null' && start != 0) {
        myPlayer.currentTime(start);
    }
}


function loadChapBar() {
    if ($('ul#slides').length != 0) {
        $('div.vjs-title').appendTo($('#player_video'));
        $('div.vjs-slide').appendTo($('#player_video'));

        if ($('.vjs-chapbar-holder').length == 0) {
            if ($('div.vjs-progress-holder').length == 0) {
                $('#player_video').append(
                    '<div class="vjs-chapbar"><div class="vjs-chapbar-holder"></div></div>'
                );
            } else {
                $('div.vjs-progress-holder').append(
                    '<div class="vjs-chapbar"><div class="vjs-chapbar-holder"></div></div>'
                );
            }
        } else {
            $('.vjs-chapbar-holder').html('');
        }

        if (myPlayer.duration() != 0) {
            var duration_vid = myPlayer.duration();
            $('ul#slides li').each(function() {
                var chapbar_left = (parseInt($(this).data('start')) / duration_vid) * 100;
                var chapbar_width = ((parseInt($(this).data('end')) / duration_vid) * 100) - chapbar_left;
                var data_id = $(this).data('id');
                $('.vjs-chapbar-holder').append(
                    '<div ' +
                        'class="vjs-chapbar-chap" ' +
                        'style="left:' + chapbar_left + '%;width:' + chapbar_width + '%;" ' +
                        'data-id="' + data_id + '"' +
                    '></div>'
                );
                if ($(this).attr('data-start')) {
                    timestamps.push({
                        start : +$(this).attr('data-start'),
                        end : +$(this).attr('data-end'),
                        elm : $(this)
                    });
                }
            });
            /*
            if (typeof is_chaptering != 'undefined' && is_chaptering == true) {
                $('.vjs-chapbar-chap').on('click', function(e) {
                    chapbar($(this));
                });
            }
            */
        }
    }
}

/**
 * Calcule de manière automatique la résolution la plus optimisée pour le débit de la connexion de l'utilisateur
 */
function progress() {
    if (typeof myPlayer.availableRes != 'undefined' && myPlayer.availableRes.length > 0 && changeResBd == false) {
        var howMuchIsDownloaded = myPlayer.bufferedPercent();
        var seconds = Math.round(Date.now() / 1000);
        var filesize = myPlayer.currentSrc().indexOf('video/mp4') != -1 ? videosize_mp4 : videosize_webm;

        if (seconds != previoustime && howMuchIsDownloaded < 1) {
            intcheck++;
            var lapstime = seconds - previoustime;
            if(previoustime==0) lapstime = 1;
            var downloaded = filesize * howMuchIsDownloaded;
            var laspdl = downloaded - previousuploaded;
            mediumspeed = mediumspeed + Math.round((laspdl / lapstime) / 1000);

            if (intcheck % 4 == 0) {
                mediumspeed = mediumspeed / 4;
                if (mediumspeed > 2200 && typeof myPlayer.availableRes['1080'] != 'undefined') {
                    $('div.vjs-res-button').find('li:contains("1080p")').trigger('click');
                    changeResBd = true;
                } else {
                    if (mediumspeed > 1200 && typeof myPlayer.availableRes['720'] != 'undefined') {
                        $('div.vjs-res-button').find('li:contains("720p")').trigger('click');
                        changeResBd = true;
                    } else {
                        if (mediumspeed > 700 && typeof myPlayer.availableRes['480'] != 'undefined') {
                            $('div.vjs-res-button').find('li:contains("480p")').trigger('click');
                            changeResBd = true;
                        }
                    }
                }
            } else if (howMuchIsDownloaded == 1) {
                $($('div.vjs-res-button li').get(1)).trigger('click'); // 0 is quality so 1 is the highest resolution
                changeResBd = true;
            }

            previoustime = seconds;
            previousuploaded = downloaded;
        } else if (howMuchIsDownloaded == 1) {
            $($('div.vjs-res-button li').get(1)).trigger('click'); // 0 is quality so 1 is the highest resolution
            changeResBd = true;
        }
    }
}

function error(err) {
    // prints the name of the error
    // alert(err.name);
    // prints the description that is also shown in the error console
    console.log(err.message);
    // this works only in some browsers
    // line and stack are not supported by all vendors
    console.log(err.line, err.stack);
}