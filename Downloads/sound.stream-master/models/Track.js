var keystone = require('keystone');
var Types = keystone.Field.Types;
var request = require('request');
var moment = require('moment');

/**
 * Track Model
 * ==========
 */

var Track = new keystone.List('Track');

Track.add({
    title: {type: Types.Text, watch: 'url', value:getTitle},
    thumbnail: { type: Types.Text, watch: 'trackId', value: function () {
        return 'https://img.youtube.com/vi/' + this.trackId + '/default.jpg';
    } },
	duration: {type: Types.Number, watch: 'url', value:getDuration},
    dateAdded: {type: Types.Datetime, default: Date.now, required:true },
    likedBy: {type: Types.Relationship, ref: 'User', many: true},
	likes: {type: Types.Number, default: 0, watch: 'likedBy', noedit: true, value: function() {
        return this.likedBy.length;
    }},
    url: {type: Types.Text, default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', required:true},
    trackId: {type: Types.Text, watch: "url", value: function() {
        return this.url.split("=")[1];
    }}
});


/**
 * Registration
 * ============
 */

Track.register();

function getDuration(callback) {
	request.get([
		'https://www.googleapis.com/youtube/v3/videos?',
		'part=contentDetails&',
		'id=' + this.url.split('=')[1] + '&',
		'key=AIzaSyBR3hl9QYBkAe1ORhz_E1zcSBLsg22ppBg'
	].join(''),
	function (err, res, data) {

		data = JSON.parse(data);

		var milliseconds = moment.duration(data.items[0].contentDetails.duration, moment.ISO_8601).asMilliseconds();

		console.log("Got Duration: " + milliseconds + "ms");
		callback(err, milliseconds);
	});
}

function getTitle(callback) {
    request.get([
		'https://www.googleapis.com/youtube/v3/videos?',
		'part=snippet&',
		'id=' + this.url.split('=')[1] + '&',
		'key=AIzaSyBR3hl9QYBkAe1ORhz_E1zcSBLsg22ppBg'
	].join(''),
	function (err, res, data) {

		data = JSON.parse(data);

		console.log("Got Title: " + data.items[0].snippet.title + "ms");
		callback(err, data.items[0].snippet.title);
	});
}