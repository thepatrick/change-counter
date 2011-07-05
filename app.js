/*global __dirname*/
/**
 * Module dependencies.
 */

var express = require('express'),  
    Auth = require ('./patrickidconsumer'),
    Data = require('./moneyprovider').DataProvider,
    helpers = require('./helpers'),
    actions = require('./actions'),
    options = {
        cache: true,
        compile: true,
        locals: {},
        blockHelpers: {
            properties: function (context, fn) {
                    var props = JSON.parse("{" + fn(this) + "}");
                    for (var prop in props) {
                            if (props.hasOwnProperty(prop)) {
                                    context[prop] = props[prop];
                            }
                    }
                    return "";
            }
        }
    },
    sessionSecret = process.env['SESSION_SECRET'],
    authServer = process.env["AUTH_SERVER"],
    authApp = process.env["AUTH_APP"],
    authSecret = process.env['AUTH_SECRET'],
    app, auth, money;
    
module.exports = app = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.favicon());
  app.use(express.cookieParser());
  app.use(express.responseTime());
  app.use(express.session({ secret: sessionSecret }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Providers
auth = new Auth(authServer, authApp, authSecret);
money = new Data("localhost", 5984, 'money');

// Routes
app.get('/completeLogin', actions.completeLogin(auth));
app.get('/logout', helpers.requireLogin(auth, options), actions.logout());
app.get('/', helpers.requireLogin(auth, options), actions.index(options, money));
app.post('/deposit', helpers.requireLogin(auth, options), actions.deposit(money));

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);