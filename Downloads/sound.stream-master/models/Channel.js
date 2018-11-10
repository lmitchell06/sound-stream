var keystone = require('keystone');
var Types = keystone.Field.Types;
var request = require('request');
var moment = require('moment');
var a = require('async');

/**
 * Channel Model
 * ==========
 */
var Channel = new keystone.List('Channel', {
    autokey: {
        path: 'slug',
        from: 'title',
        unique: true
    }
});

Channel.add({
    title: {
        type: Types.Text,
        required: true,
        index: true,
        initial: true
    },
    slug: {
        type: String,
        readonly: true
    },
    currentTrack: {
        type: Types.Relationship,
        ref: 'Track',
        initial: true
    },
    queue: {
        type: Types.Relationship,
        ref: 'Track',
        many: true,
    },
    startTime: {
        type: Types.Number,
        value: setStartTime,
        watch: 'currentTrack'
    },
	publishedAt: {
		type: Types.Datetime,
		value: function() {
			return Date.now();
		},
		watch: 'title',
		noedit: true
	},
    restart: {
        type: Types.Boolean,
        watch: 'restart',
        value: start,
    },
    firstRun: {
        type: Types.Boolean,
        default: false,
        initial: true
    },
    totalLikes: {
        type: Types.Number,
        watch: 'currentTrack',
        value: function(callback) {
            keystone.list('Channel').model
            .findById(this._id)
            .populate('queue currentTrack')
            .exec(function (err, data) {
                if (data) {
                    var total = 0;
                    total += data.currentTrack.likes;
                    data.queue.forEach(function (item) {
                        total += item.likes;
                    });
                    callback(null, total);
                } else {
                    callback(null, 0);
                }
            });
        }
    }
});

/**
 * Registration
 */
Channel.register();

function start(callback) {
    var channel = this;
    if (this.currentTrack && this.queue.length != 0) {
        var channelId = this._id;
        keystone.list('Track').model
        .findById(this.currentTrack)
        .exec(function(err, data) {
            delay(data.duration).then(function() {
                flipTrack(channelId);
            });
            channel.startTime = Date.now();
            callback(null);
        });
    } else if (this.currentTrack && this.firstRun == false) {
        fillPlaylist(this._id);
        callback(null)
    } else {
        callback(null)
    }
}

function fillPlaylist(channelId) {
    console.log("Filling queue")
    keystone.list('Channel').model
        .findById(channelId)
        .populate('currentTrack')
        .exec(function (err, channel) {
            channel.queue = [];
            request.get([
		'https://www.googleapis.com/youtube/v3/search?',
		'part=snippet&',
		'maxResults=15&',
		'relatedToVideoId=' + channel.currentTrack.url.split('=')[1] + '&',
		'type=video&',
		'key=AIzaSyBR3hl9QYBkAe1ORhz_E1zcSBLsg22ppBg&',
			].join(''),
                function (err, res, data) {
                    data = JSON.parse(data);
                    var newTracks = [];
                    var newTrackIds = [];
                    var newTrackFunctions = [];
                    var Track = keystone.list('Track');
                    console.log(data);
                    for (var i = 0; i < data.items.length; i++) {
                        newTracks[i] = new Track.model({
                            title: data.items[i].snippet.title,
                            url: 'https://www.youtube.com/watch?v=' + data.items[i].id.videoId
                        });
                        newTrackIds.push(newTracks[i].id);
                        newTrackFunctions.push(newTracks[i].save);
                    }
                    a.parallel(newTrackFunctions, function() {
                        channel.queue = newTrackIds;
                        channel.save(function() {
                            delay(channel.currentTrack.duration).then(function() {
                                flipTrack(channel._id);
                            });
                        });
                    });
                });
        });
}

function setStartTime(callback) {
    console.log("Setting start time")
    var channelId = this._id;
    keystone.list('Track').model
    .findById(this.currentTrack)
    .exec(function(err, data) {
        callback(null, new Date().getTime());
        delay(data.duration).then(function() {
            flipTrack(channelId);
        });
    });
}

function flipTrack(id) {
    var trackId;
    console.log("Flipping track")
    keystone.list('Channel').model
    .findById(id)
    .exec()
    .then(function (data) {
        trackId = data.currentTrack;
        data.queue.push(trackId);
        data.currentTrack = data.queue.shift();
        return data.save();
    }).then(function(err) {
        return keystone.list('Track').model
        .findById(trackId)
        .exec()
    }).then(function (track) {
        track.likedBy = [];
        track.save();
    });
}
/*
// called whenever the restart boolean is flipped. This occurs to every channel when the server starts
function start(callback) {

    var shouldCycle = true;
    var id = this._id;
    var track1 = this.track1;

    // if there is no track 1, just get out of this function cause nothing can be done
    if (!track1) {
        return callback(null, 0);
        // if we do not have the rest of the queue filled, then we must fill the queue and NOT cycle the tracks
    } else if (!this.track2 && !this.track3 && !this.track4) {
        shouldCycle = false;
        // calls nextTracks to get 3 new tracks from YouTube to put in the queue
        nextTracks(id, track1).then(function (tracks) {

            // loops through the available slots in the Channel and adds each new track to that slot
            for (var i = 2; i < 5; i++) {
                enqueue(id, i, tracks[i - 2]);
            }
            console.log("Filling Queue");
            return keystone.list("Track").model.findById(track1).exec();
        }).then(function (data) {
            // since we've done everything now, set the startTime in the Channel by calling the callback. This works because this whole function is called to calculate the value of the startTime field. 
            callback(null, new Date().getTime());
            // after the duration of the next track has elapsed i.e. the track has ended; flip restart to start this whole process again
            return delay(data.duration);
        }).then(function () {
            keystone.list("Channel").model.findById(id)
                .exec(function (err, data) {
                    if (data.restart) {
                        data.restart = false;
                    } else {
                        data.restart = true;
                    }
                    data.save();
                });
        });
    }

    // if the queue is full and it is time to cyclce the queue rather than to fill the queue.
    if (shouldCycle) {
        console.log("Cycling Queue");

        var next1 = this.track2;
        var next2 = this.track3;
        var next3 = this.track4;
        var channel = this;

        // although "this" already refers to the current channel, we're accessing the channel again so that we can save the tracks in their new position before moving on
        keystone.list("Channel").model.findById(id)
            .exec()
            .then(function (channelData) {
                // simple swapsies to move each track down one notch in the queue
                channelData.track1 = next1;
                channelData.track2 = next2;
                channelData.track3 = next3;
                return channelData.save();
            }).then(function (err) {
                // gets a new track from YouTube
                return nextTrack(id, next3);
            }).then(function (video) {
                // puts that new track in position 4 of the queue
                return enqueue(id, 4, video);
            }).then(function () {
                // gets the new 1st track in the queue from the DB
                return keystone.list("Track").model.findById(next1).exec();
            }).then(function (data) {
                // sets the start time and lines up the next restart to be called after the song has finished. This promise is resolved after the duration of the track
                console.log("Next Flip for " + channel.title + " in " + Math.round(data.duration / 1000) + " seconds");
                callback(null, new Date().getTime());
                return delay(data.duration);
            }).then(function () {
                // gets the current channel again (because it's been ages since we last saved it)
                return keystone.list("Channel").model.findById(id).exec()
            }).then(function () {
                // flips the restart switch which will cause this whole function to be called again.
                console.log("FLIPPING " + data.title);
                if (data.restart) {
                    data.restart = false;
                } else {
                    data.restart = true;
                }
                data.save();
            });
    }
}

function nextTrack(channelId, trackId, resultNo) {

    return new Promise((finish, reject) => {
        var titles = [];

        console.log("Getting a New Track from YouTube");

        // get the current channel and populate data in the related fields
        keystone.list("Channel").model.findById(channelId)
            .populate("track1 track2 track3 track4")
            .exec()
            .then(function (channel) {

                // push the title of track1 to the list of existing titles
                titles.push(channel.track1.title);

                // push the title of each other track if it exists, if not, set it to a '.' (for lols)
                if (channel.track2 == null) {
                    titles.push('.');
                } else {
                    titles.push(channel.track2.title);
                }

                if (channel.track3 == null) {
                    titles.push('.');
                } else {
                    titles.push(channel.track3.title);
                }

                if (channel.track4 == null) {
                    titles.push('.');
                } else {
                    titles.push(channel.track4.title);
                }

                // get the track data for the track id that was passed to this function. Usually gonna be track 1 to find a related track
                keystone.list("Track").model.findById(trackId).exec(function (err, track) {
                    // assemble the request to the YouTube API
                    request.get([
		'https://www.googleapis.com/youtube/v3/search?',
		'part=snippet&',
		'maxResults=30&',
		'relatedToVideoId=' + track.url.split('=')[1] + '&',
		'type=video&',
		'key=AIzaSyBR3hl9QYBkAe1ORhz_E1zcSBLsg22ppBg&',
			].join(''),
                        function (err, res, data) {
                            // assemble the returned string from YouTube into a workable object
                            var data = JSON.parse(data);
                            var foundSlot = false;

                            console.log("Number of vids from YouTube: " + data.items.length);

                            // loops through all the vids we got from youtube
                            for (var i = 0; i < data.items.length; i++) {
                                var foundMatch = false;
                                // loops through all the titles in our array of existing titles
                                for (var j = 0; j < titles.length; j++) {
                                    if (titles[j] == data.items[i].snippet.title) {
                                        // the titles are the same, we found a collision so we're not using this track
                                        console.log("COLLISION -----------------------------------");
                                        console.log("YouTube Title: " + data.items[i].snippet.title);
                                        console.log("Saved Title: " + titles[j]);
                                        foundMatch = true;
                                    }
                                }
                                if (!foundMatch) {
                                    // if no collision was found for this track, we can return it by resolving the original promise
                                    console.log("SLOTTING IN: " + data.items[i].snippet.title);
                                    foundSlot = true;
                                    channel.save(function (err) {
                                        finish(data.items[i]);
                                    });
                                    break;
                                }
                            }
                            // if we did a major goof and somehow youtube found us 30 tracks that were all the same as the ones we have in the queue, handle the error gracefully with this super helpful console log statement
                            if (!foundSlot) {
                                console.log("No unique track found on YouTube");
                            }
                        });
                });
            });
    });
}

// Gets 3 new tracks to be added to an empty queue
function nextTracks(channelId, trackId) {
    console.log("Getting NEXT TRACKS");
    return new Promise((resolve, reject) => {

        keystone.list("Channel").model.findById(channelId)
            .populate("track1")
            .exec(function (err, channel) {

                keystone.list("Track").model.findById(trackId)
                    .exec(function (err, track) {
                        request.get([
		'https://www.googleapis.com/youtube/v3/search?',
		'part=snippet&',
		'maxResults=3&',
		'relatedToVideoId=' + track.url.split('=')[1] + '&',
		'type=video&',
		'key=AIzaSyBR3hl9QYBkAe1ORhz_E1zcSBLsg22ppBg&',
			].join(''),
                            function (err, res, data) {
                                var data = JSON.parse(data);
                                resolve(data.items);
                            });
                    });
            });
    });
}

// Adds a fetched track to a slot in the queue
function enqueue(channelId, slotNo, video) {

    return new Promise((resolve, reject) => {
        console.log("Queuing Track");

        var Track = keystone.list("Track");

        // creates the new track with the bare minimum info
        var newTrack = new Track.model({
            title: video.snippet.title,
            url: 'https://www.youtube.com/watch?v=' + video.id.videoId
        });

        newTrack.save(function (err) {
            console.log("Saved a New Track");

            var newTrackId = newTrack.id;

            // puts the new track id in the related field of the channel
            keystone.list("Channel").model.findById(channelId)
                .exec(function (err, data) {
                    if (slotNo == 1) {
                        data.track1 = newTrackId;
                    } else if (slotNo == 2) {
                        data.track2 = newTrackId;
                    } else if (slotNo == 3) {
                        data.track3 = newTrackId;
                    } else {
                        data.track4 = newTrackId;
                    }
                    data.save(function (err) {
                        console.log("Saved Channel with new Track");
                        resolve();
                    });
                });
        });
    });
}
*/
// A helper function used to create a promise that is resolved after a specified delay
function delay(t) {
    return new Promise(function (resolve) {
        setTimeout(resolve, t)
    });
}
