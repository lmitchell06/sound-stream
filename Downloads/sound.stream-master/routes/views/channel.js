var keystone = require('keystone');
var moment = require('moment');
var momentDuration = require('moment-duration-format');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';

    /* What is all this?????
	keystone.list('Channel').model.findOne({
			'slug': req.params.channel
		})
		.populate('currentTrack queue')
		.lean()
		.exec(function (err, data) {
			if (typeof data.currentTrack !== "undefined") {
				console.log("working");
			}
			else {
				console.log("borked");
			}
		});
        */

	view.on('init', function (next) {
		keystone.list('Channel').model.findOne({
				'slug': req.params.channel
			})
			.populate('currentTrack queue')
			.lean()
			.exec(function (err, data) {
				if (data == null) {
					res.status(404).render('404')
				}
				else {
					data.currentTrack.duration = moment.duration(data.currentTrack.duration).format('m:ss');
                    var likeCount = 0;
					for (var i = 0; i < data.queue.length; i++) {
						var duration = moment.duration(data.queue[i].duration);
						data.queue[i].position = i + 1;
                        likeCount += data.queue[i].likes;
						// if (data.queue[i].likedBy.indexOf(req.user._id))
						if (req.user && data.queue[i].likedBy != undefined) {
							var found = data.queue[i].likedBy.find(function (item) {
								return item == req.user.id;
							});
							if (found) {
								data.queue[i].hasLiked = true;
							} else {
								data.queue[i].hasLiked = false;
							}
						} else {
							data.queue[i].hasLiked = false;
						}
					}
					var package = {
						data: data,
						trackId: data.currentTrack.url.split("=")[1]
					};
					res.locals = package;
					res.locals.user = req.user;
					next(err);
				}
			});
	});

	// Render the view
	view.render('channel');
};