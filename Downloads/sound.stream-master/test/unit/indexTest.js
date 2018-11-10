require('dotenv').config();

// Base routes
var app = "http://localhost:3000";

// Requires
var request = require("request"),
	chai = require("chai"),
	chaiHttp = require('chai-http');

// Keystone setup
var keystone = require('keystone'),
	handlebars = require('express-handlebars'),
	dbURI = process.env.MONGO_URI;

// Chai setup
chai.use(chaiHttp);
var assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	requestApp = chai.request(app);



describe("Sound Stream", function () {
	before(function (done) {
		this.timeout(20000);
		initialiseKeystone(done);
	});

	it('Should be a connection to Mongo', function (done) {
		keystone.mongoose.connection.db.should.be.a('Object');
		done();
	});

	it('Should have a Channel Mongoose Model', function (done) {
		Channel = keystone.list('Channel');

		Channel.should.be.a('Object');
		Channel.should.have.property('model').be.a('Function');
		Channel.should.have.property('schema').be.a('Object');

		done();
	});
	
	it('Should have a Track Mongoose Model', function (done) {
		Track = keystone.list('Track');

		Track.should.be.a('Object');
		Track.should.have.property('model').be.a('Function');
		Track.should.have.property('schema').be.a('Object');

		done();
	});
	
	it('Should have a User Mongoose Model', function (done) {
		User = keystone.list('User');

		User.should.be.a('Object');
		User.should.have.property('model').be.a('Function');
		User.should.have.property('schema').be.a('Object');

		done();
	});

	it("Returns status code 200 at index", function (done) {
		requestApp
			.get('/')
			.end(function (err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});

	it('has a body at index', function (done) {
		requestApp
			.get('/')
			.end(function (err, res) {
				should.exist(res.body);
				done();
			});
	});

});


function initialiseKeystone(callback) {

	// Initialise Keystone with your project's configuration.
	// See http://keystonejs.com/guide/config for available options
	// and documentation.

	keystone.init({
		'name': 'sound.stream',
		'brand': 'sound.stream',

		'less': '../public',
		'static': '../public',
		'favicon': '../public/favicon.ico',
		'views': '../templates/views',
		'view engine': '.hbs',

		'custom engine': handlebars.create({
			layoutsDir: 'templates/views/layouts',
			partialsDir: 'templates/views/partials',
			defaultLayout: 'default',
			helpers: new require('../../templates/views/helpers')(),
			extname: '.hbs',
		}).engine,

		'emails': '../templates/emails',

		'auto update': false,
		'logger': false,
		'session': true,
		'auth': true,
		'user model': 'User',
	});

	// Load your project's Models
	keystone.import('../models');

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
	keystone.set('routes', require('../../routes'));


	// Configure the navigation bar in Keystone's Admin UI
	keystone.set('nav', {
		users: 'users',
	});

	// Start Keystone to connect to your database and initialise the web server


	if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
		console.log('----------------------------------------' + '\nWARNING: MISSING MAILGUN CREDENTIALS' + '\n----------------------------------------' + '\nYou have opted into email sending but have not provided' + '\nmailgun credentials. Attempts to send will fail.' + '\n\nCreate a mailgun account and add the credentials to the .env file to' + '\nset up your mailgun integration');
	}

	keystone.start(callback);
}