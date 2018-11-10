process.env.NODE_ENV = process.env.NODE_ENV || 'test';
require('dotenv').config();

var keystone = require('keystone');
var chai = require('chai');

keystone.init({
  'name': 'sound.stream',
  's3 config': {} //leave this here or stuff will break (magic)
});

keystone.import('../models');