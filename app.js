'use strict';

// Set variables for environment
var _ = require('underscore');
var React = require('react');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var port = 4000;

// Local vars
var comPath = __dirname + '/../1stdibs.com/';

// Constants
var TYPE_VIEW = 'view';
var TYPE_APP = 'app';

// Compile react views
require('node-jsx').install({extension: '.jsx'});
require('babel/register')({ ignore: false, extensions: ['.jsx', '.js', '.es.js'], only: /\.es\.js|jsx$/ });

var app = express();

// Instruct express to server up static assets
app.use(express.static(__dirname + '/public'));

app.use(cookieParser());

// To support JSON-encoded bodies
app.use(bodyParser.json());

// Set render routes
app.use('/render/:type', _render);

// Set routes
app.get('/', function(req, res) {
    res.render('index.html');
});

/**
 *
 * @param req
 * @param res
 * @param next
 * @private
 */
function _render (req, res, next) {
    var body = req.body;
    var props;
    var dir;
    var component;
    var ret;
    var err;
    var type;
    var data;
    var cookies;

    if (req.method !== 'POST') {
        err = 'Method not supported.';
        res.status(405).send(err);
        next(err);
    }

    if (_.isEmpty(req.params) || !req.params.type) {
        err = 'Request contained no type parameter.';
        res.status(400).send(err);
        next(err);
    }

    if (_.isEmpty(body) || !_.isObject(body)) {
        err = 'Request contained no JSON.';
        res.status(400).send(err);
        next(err);
    }

    if (!body.dir) {
        err = 'Body contained no dir property.';
        res.status(400).send(err);
        next(err);
    }

    type = req.params.type;
    dir = comPath + body.dir;
    cookies = req.cookies || {};

    try {
        if (type === TYPE_APP) {
            // Fluxible App that fetches data to render React component to string
            data = {
                cookies : cookies,
                serverVars : body.data || {}
            };
            app = require(dir);
            // Synchronous call
            app.render(data).done(function (data) {
                res.status(200).json(data);
                next();
            });
        } else if (type === TYPE_VIEW) {
            // Template data passed down to props to render React component to string
            props = body.data || {};
            component = React.createFactory(require(dir));
            // Set on view property to keep contract consistent across types
            ret = {
                view : React.renderToString(component(props))
            };
            res.status(200).json(ret);
            next();
        }
    } catch (e) {
        console.log(e);
        res.status(400).send('Encountered an error while attempting to render ' + type + ': ' + + e);
    }
}

// Set server port
app.listen(port, function () {
    console.log('React server-side app listening on PORT: ' + port);
});
