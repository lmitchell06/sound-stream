var keystone = require('keystone');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';

	view.on('init', function (next) {
		keystone.list('Channel').model.find()
			.limit(4)
			.sort('-publishedAt')
            .populate('currentTrack')
			.exec(function (err, data) {
				res.locals.recent = data;
				res.locals.user = req.user;
				next(err);
			});
	});
    
    view.on('init', function (next) {
		keystone.list('Channel').model.find()
			.limit(4)
			.sort('-totalLikes')
            .populate('currentTrack')
			.exec(function (err, data) {
				res.locals.trending = data;
				next(err);
			});
	});
	
	// Render the view
	view.render('home');
};
