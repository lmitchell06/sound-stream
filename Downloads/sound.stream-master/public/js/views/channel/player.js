var player;

$(function() {
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    setInterval(updateTime, 1000);
    
    //Socket.io
    var socket = io();
    socket.on('reordered', reorderQueue);
});

function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		height: '390',
		width: '640',
		videoId: $("#player").data('id'),
		autoplay: true,
		loop: true,
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

function onPlayerReady(event) {
	getTime().then(function (playhead) {
        event.target.seekTo(playhead);
    });
}

function onPlayerStateChange(event) {
	if (event.data == 0) {
        trackFinished();
    }
    return;
}

function trackFinished() {
    isNewTrack().then(function(newId) {
        if (newId != false) {
            console.log("Getting New Track");
            getTime().then(function (time) {
                player.loadVideoById(newId, time);
                // contact servers something
                refreshUi(function() {
                    player.playVideo;
                });
            });
        } else {
            console.log("NEW TRACK LATE... Retrying");
            window.setTimeout(trackFinished, 2000);
        }
    });
}

function isNewTrack() {
    return new Promise((resolve, reject) => {
        $.post("/" + $("#player").data('slug') + "/get-id", function (data, status) {
            if (data.id === $("#player").data('id')) {
                resolve(false);
            } else {
                resolve(data.id);
            }
        });
    });
}

function getTime() {
    return new Promise((resolve, reject) => {
            $.post("/" + $("#player").data('slug') + "/get-time", function (data, status) {

            var playhead = Math.round(((new Date()).getTime() - data.startTime) / 1000);
                
            resolve(playhead);
        });
    });
}

function newChannel(title) {
	$.post('/create-channel', {
		title: title
	}, function(data, status) {
		console.log(data.message);
	});
}

function refreshUi(callback) {
    console.log('Refreshing UI');
    $.post('/' + $("#player").data('slug') + '/get-channel', function(data, status) {
        $('.current-track-title').text(data.currentTrack.title);
        console.log(data.currentTrack.duration);
        $('.current-time .total').text(moment.duration(data.currentTrack.duration, 'milliseconds').format('m:ss', {trim: false}));
        reorderQueue(data.queue);
        callback();
    });
}

function updateTime() {
    var time = player.getCurrentTime();
    
    var formattedTime = moment.duration(time, 'seconds').format('m:ss', {trim: false});
    
    $('.current-time .current').text(formattedTime);
    if(player.getDuration() > 0) {
    $('#progress-bar').attr("style","width:" +  time / player.getDuration() * 100 + '%');
    }
}

function reorderQueue(queue) {
    console.log(queue);
    var position = 0;
    $('.queue-holder').empty();
    queue.forEach(function (item) {
        console.log(item.duration);
        position++;
        var html = [
            '<div class="row ' + item._id + '">',
            '    <div class="col-xl-1 col-lg-1 col-md-1">',
            '        <h4>' + position + '</h4>',
            '    </div>',
            '    <div class="col-xl-5 col-lg-5 col-md-5">',
            '        <h4>' + item.title + '</h4>',
            '    </div>',
            '    <div class="col-xl-3 col-lg-3 col-md-3">',
            '        <h4 class="duration">' + moment.duration(item.duration, 'milliseconds').format('m:ss', {trim: false}) + '</h4>',
            '    </div>',
            '    <div class="col-xl-3 col-lg-3 col-md-3">',
            '        <h4 class="track-likes">' + item.likes + '</h4>',
            '        <button class="like-button" onclick="like(\'' + item._id + '\')">',
            '            <img src="' + (hasLiked(item) ? "/icons/Purple/like.svg" : "/icons/White/like.svg")  + '" class="like-img">',
            '        </button>',
            '    </div>',
            '</div>'
        ].join('');
        $('.queue-holder').append(html);
    });
}

function hasLiked(track) {
    var id = $('.user-id').val();
    var found = false;
    track.likedBy.forEach(function (item) {
        if (item === id) {
            found = true;
        }
    });
    return found;
}