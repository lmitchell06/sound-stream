/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var moment = require('moment');
var momentDuration = require('moment-duration-format');
var _ = require('underscore');

// Common Middleware
keystone.pre('routes', middleware.initErrorHandlers);
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Handle 404 errors
keystone.set('404', function(req, res, next) {
    res.notfound();
});
 
// Handle other errors
keystone.set('500', function(err, req, res, next) {
    var title, message;
    if (err instanceof Error) {
        message = err.message;
        err = err.stack;
    }
    res.err(err, title, message);
});

// Import Route Controllers
var routes = {
    views: importRoutes('./views'),
};

// Setup Route Bindings
exports = module.exports = function (app) {
    
    var io;
	
	app.use(cookieParser());
    app.use(session({
        secret: 'keyboard cat',
        resave: true,
        saveUninitialized: true,
        cookie: {
            secure: false
        }
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    
    //Socket.io
    var attempt = 1;
    attemptSocket();
    function attemptSocket() {
        console.log('Attempt ' + attempt + ' to connect socket...');
        if (io != undefined) {
            io.on('connection', function(socket) {
                console.log('A user has connected to the server');
                socket.on('disconnect', function(socket) {
                    console.log('A user has disconnected from the server');
                });
            });
            console.log('Socket connected');
        } else {
            io = keystone.get('io');
            attempt++;
            setTimeout(attemptSocket, 1000);
        }
    }
	
    // Views
    app.get('/', routes.views.home);
    app.get('/:channel', routes.views.channel);

    app.post('/:channel/get-time', function (req, res) {
        keystone.list('Channel').model.findOne({
                'slug': req.params.channel
            })
            .exec(function (err, data) {
                res.send({
                    startTime: data.startTime
                });
            });
    });
    
    
    // EMERGENCY THUMBNAIL GETTER - Uncomment to refresh all thumbnails on launch
    /*
    keystone.list('Track').model.find()
    .exec(function(err, data) {
        data.forEach(function(item) {
            item.thumbnail = 'https://img.youtube.com/vi/' + item.trackId + '/default.jpg';
            item.save();
        });
    });
    */

    app.post('/:channel/get-id', function (req, res) {
        var channelId;

        keystone.list("Channel").model.findOne({
                slug: req.params.channel
            })
            .populate("currentTrack")
            .exec(function (err, data) {
                res.send({
                    id: data.currentTrack.trackId
                });
            });
    });

    app.post('/:channel/get-channel', function (req, res) {
        var channelId;

        keystone.list("Channel").model.findOne({
                slug: req.params.channel
            })
            .populate("currentTrack queue")
            .lean()
            .exec(function (err, data) {
                for (var i = 0; i < data.queue.length; i++) {
                    data.queue[i].position = i + 1;
                }
                res.send(data);
            });
    });
    
    app.post('/:channel/like', function (req, res) {
        keystone.list('Track').model
        .findOne()
        .where('_id', req.body.id)
        .exec(function (err, data) {
            var likedBy = data.likedBy;
            
            if (req.user == null) {
                res.send({
                    message: 'User is not logged in.'
                });
                return;
            }
            
            var userId = req.user._id;
            
            var index = likedBy.indexOf(userId);
            
            if (index != -1) {
                var message = 'unliked';
                console.log('Unliking');
                data.likedBy.splice(index, 1);
            } else {
                var message = 'liked';
                console.log('Liking');
                data.likedBy.push(userId);
            }
            
            data.save(function (err) {
                reorderQueue(req.params.channel);
                res.send({
                    message: message,
                    likes: data.likedBy.length
                });
            });
        })
    });

    app.post('/create-channel', function (req, res) {
        let data = req.body;
        let channelName = data.channel_name;
        let firstTrackId = data.first_track_id;

        let Channel = keystone.list("Channel");

        let newChannel = new Channel.model({
            title: channelName,
            currentTrack: firstTrackId,
            firstRun: true
        });

        var responseMessage = "channel created " + newChannel.title;

        newChannel.save()
            .then(function () {
                return keystone.list('Channel').model.findById(newChannel._id);
            }).then(function (channel) {
                channel.restart = true;
                channel.firstRun = false;
                return channel.save();
            }).then(function () {
                res.send({
                    message: responseMessage,
                    slug: newChannel.slug
                });
            });
    });

    app.post('/create-track', function (req, res) {
        let data = req.body;
        let trackUrl = data.track_url;

        let Track = keystone.list("Track");

        let newTrack = new Track.model({
            url: trackUrl
        });

        var responseMessage = "track created " + newTrack.id;

        newTrack.save().then(function (err) {
			console.log('Created Track');
			return keystone.list('Channel').model.findOne().where('slug', req.body.channel_slug).exec();
		}).then(function (data) {
			if (data == null) {
				res.send({
					message: responseMessage,
					id: newTrack.id
				});
			}
			data.queue.push(newTrack.id);
			return data.save();
		}).then(function (err) {
			console.log('Saved Channel');
			res.send({
                message: responseMessage,
                id: newTrack.id
            });
		});
    });

    app.post('/search-channels', function (req, res) {
        let data = req.body;
        let query = data.query;

        let Channel = keystone.list("Channel");

        var responseMessage = query;

        var searchTerm = new RegExp(query, 'i');

        Channel.model.find()
            .where('title', searchTerm)
            .limit(5)
            .exec(function (err, channels) {
                res.send({
                    message: responseMessage,
                    channels: channels
                });
            });
    });
	
	app.post('/login', function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if (info) {
                res.send(info);
                res.end();
            } else {
                req.logIn(user, function (err) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.send({
                            message: 'success'
                        })
                    }
                    res.end();
                });
            }
        })(req, res, next);
    });
	
	app.post('/register', function (req, res) {
        var params = req.body;
        User = keystone.list("User");
        User.model.find()
            .where("email", params.email)
            .exec(function (err, data) {
                if (data.length >= 1) {
                    res.send({
                        message: "An account with that email address already exists."
                    });
                } else {
                    var newUser = new User.model({
                        email: params.username,
                        password: params.password
                    });

                    newUser.save(function (err) {
                        req.login(newUser, function(err) {
                            if (err) {
                                res.send({
									message: 'error'
								});
                            } else {
                                res.send({
                                    message: 'success'
                                });
                            }
							res.end();
                        });
                    });
                }
            });
    });

    app.post('/sign-out', function (req, res) {
        req.session.destroy(function (err) {
            res.send(true);
        });
    });
    
    function reorderQueue(channelSlug) {
        console.log('Reordering Queue');
        keystone.list('Channel').model
        .findOne()
        .where('slug', channelSlug)
        .populate('queue')
        .exec(function (err, data) {
            data.queue = _.sortBy(data.queue, function(item) {
                return item.likes * -1;
            });
            data.save(function(err) {
                console.log('Reordered Queue');
                io.emit('reordered', data.queue);
            });
        });
    }

    // NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
    // app.get('/protected', middleware.requireUser, routes.views.protected);
};
