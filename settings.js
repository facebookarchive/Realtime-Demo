var express = require('express');

var app = express.createServer();
exports.app = app;

exports.appPort = process.env.IG_APP_PORT || 3000;
exports.CLIENT_ID = process.env.IG_CLIENT_ID || 'YOUR+CLIENT+ID';
exports.CLIENT_SECRET = process.env.IG_CLIENT_SECRET || 'YOUR+CLIENT+SECRET';
exports.httpClient = (process.env.IG_USE_INSECURE ? require('http') : require('https'));
exports.apiHost = process.env.IG_API_HOST || 'api.instagram.com';
exports.apiPort = process.env.IG_API_PORT || null;
exports.basePath = process.env.IG_BASE_PATH || '';
exports.REDIS_PORT = 6486;
exports.REDIS_HOST = '127.0.0.1';

app.set('view engine', 'jade');

app.configure(function(){
    app.use(express.methodOverride());
	app.use(express.bodyDecoder());
    app.use(app.router);
    app.use(express.staticProvider(__dirname + '/public/'));
});
app.configure('development', function(){
    app.use(express.logger());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
    app.use(express.errorHandler());
});