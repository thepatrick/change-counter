var copyOpts;

module.exports.copyOpts = copyOpts = function(options) {
  var newOpts = {};
  var key;
  for(key in options) {
    newOpts[key] = options[key];
  }
  return newOpts;
};

module.exports.requireLogin = function requireLogin(auth, options){
  return function requireLoginHandler(req, res, next) {
    var opts = copyOpts(options),
        sess = req.session;
    if(!(sess.user && sess.user.administrator)) {
      opts.locals = {
        login: auth.login_url('/completeLogin')
      };
      res.render('403.hbs', opts);
      return;
    }
    next();
  };
};