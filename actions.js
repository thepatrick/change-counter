var helpers = require('./helpers');
module.exports.logout = function() {
  return function(req,res){
    req.session.destroy(function(err){
      res.redirect('/');
    });
  };
};

module.exports.completeLogin = function(auth) {
  return function(req,res) {
    var token = req.param("token");
    auth.retrieve_details(token, function(r){ 
      if(r && r.token == token) {
        req.session.user = r.user;
        req.session.save(function(){
          res.redirect('/');
        });      
      } else {
        res.redirect('/');
      }
    });
  };
};

module.exports.index = function(options, money) {
  return function(req, res){
    var opts = helpers.copyOpts(options);

    money.moneyTotal(function(balanceError, balance){
      money.totalCoins(function(totalError, totalCoins){
        money.coinCount(function(coinError, coins) {
          coins[coins.length - 1].last = true;
          var length = coins.length - 1;
          for (var i = length; i >= 0; i--){
            if(i != length) {
              coins[i].lastStr = ", ";            
            }
            var v = coins[i];
            if(v.key < 1) {
              v.key = (v.key * 100) + "c";
            } else {
              v.key = "$" + v.key;
            }
          }

          opts.locals = {
            balance: balance || balanceError,
            total: totalCoins || totalError,
            coins: coins || {}
          };
          res.render('index.hbs', opts);        
        });
      });
    });
  };
};

module.exports.deposit = function(money) {
  return function(req,res){
    function coerceItBaby(f) {
      var i = parseInt(f, 10);
      if(i && !isNaN(i)) {
        return i;
      }
      return 0;
    }
    var deposit = { 
      "description": "Deposit",
      "amount": {
        "0.05" : coerceItBaby(req.param("0.05")),
        "0.1"  : coerceItBaby(req.param("0.1" )),
        "0.2"  : coerceItBaby(req.param("0.2" )),
        "0.5"  : coerceItBaby(req.param("0.5" )),
        "1"    : coerceItBaby(req.param("1"   )),
        "2"    : coerceItBaby(req.param("2"   ))
      }
    };
    money.saveDeposit(deposit, function(error, docs) {
      res.redirect('/');
    });
  };
};