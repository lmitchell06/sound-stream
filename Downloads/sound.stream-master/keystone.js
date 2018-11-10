// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');
var handlebars = require('express-handlebars');
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var socket = require('socket.io'); 
var _ = require('underscore');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
	'name': 'sound.stream',
	'brand': 'sound.stream',

	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': '.hbs',

	'custom engine': handlebars.create({
		layoutsDir: 'templates/views/layouts',
		partialsDir: 'templates/views/partials',
		defaultLayout: 'default',
		helpers: new require('./templates/views/helpers')(),
		extname: '.hbs',
	}).engine,

	'emails': 'templates/emails',

	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		keystone.list('User').model.find()
			.where('email', username)
			.exec(function (err, data) {
				if (data.length < 1) {
					done(null, false, {
						message: 'A user with that email address does not exist.'
					});
				} else {
					data[0]._.password.compare(password, function (err, result) {
						if (result) {
							return done(null, data[0])
						} else {
							return done(null, false, {
								message: 'Incorrect password.'
							});
						}
					});
				}
			});
	}
));

passport.serializeUser(function (user, done) {
	done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    console.log('deserializing');
	keystone.list('User').model
        .findById(id)
        .populate({
                path: 'projects',
                populate: {
                    path: 'category validator'
                }
            })
        .exec(function (err, user) {
            done(err, user);
        });
});

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
});

// Load your project's Routes
keystone.set('routes', require('./routes'));


// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	users: 'users',
});

// Start Keystone to connect to your database and initialise the web server


if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
	console.log('----------------------------------------'
	+ '\nWARNING: MISSING MAILGUN CREDENTIALS'
	+ '\n----------------------------------------'
	+ '\nYou have opted into email sending but have not provided'
	+ '\nmailgun credentials. Attempts to send will fail.'
	+ '\n\nCreate a mailgun account and add the credentials to the .env file to'
	+ '\nset up your mailgun integration');
}


keystone.start({
    onStart: function() {
        keystone.set('io', socket.listen(keystone.httpServer));
    }
});

keystone.list("Channel").model.find()
.exec(function(err, data) {
   
    data.forEach(function(item) {
        if (item.restart) {
            item.restart = false;
        } else {
            item.restart = true;
        }
        item.save();
    });
    
});


/*
setInterval(ticker, 2000);

function ticker() {
	keystone.list("Channel").model.find()
	.exec(function (err, data) {
		data.forEach(function(item) {
			item.playhead += 2;
			item.save(function(err) {
				console.log(err ? err : "Updated Playhead"); 
			});
		});
	});
}
*/
