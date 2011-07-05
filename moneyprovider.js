/*global emit*/
var cradle = require('cradle'),
    util = require('util');

var DataProvider = function(host, port, db) {
  this.connection= new cradle.Connection(host, port, {
    cache: true,
    raw: false
  });
  this.db = this.connection.database(db);
  this.db.save('_design/money', {
    coinCount: {
      map: function(doc) {
        var kind;
        for(kind in doc.amount) {
          emit(kind, doc.amount[kind]);
        }
      },
      reduce: "_sum"
    },
    moneyTotal: {
      map: function(doc) {
        var kind;
        for(kind in doc.amount) {
          emit(null, doc.amount[kind] * kind);
        }
      },
      reduce: "_sum"
    },
    totalCoins: {
      map: function(doc) {
        var kind;
        for(kind in doc.amount) {
          emit(null, doc.amount[kind]);
        }
      },
      reduce: "_sum"
    }
  });
};

DataProvider.prototype.moneyTotal = function(callback) {
    this.db.view('money/moneyTotal',function(error, result) {
      if( error ){
        callback(error);
      }else{
        var docs = result && result[0] && result[0].value;
        callback(null, docs && docs.toFixed && docs.toFixed(2));
      } 
    });
};

DataProvider.prototype.totalCoins = function(callback) {
  this.db.view('money/totalCoins',function(error, result) {
    if( error ){
      callback(error);
    }else{
      var docs = result && result[0] && result[0].value;
      callback(null, docs && docs.toFixed && docs.toFixed(0));
    } 
  });  
};

DataProvider.prototype.coinCount = function(callback) {
  this.db.view('money/coinCount', { group: true }, function(error, result) {
    if(error) {
      util.log("err:" + util.inspect(error));
      callback(error);
    } else {
      callback(null, result.rows);
    }
  });
};

DataProvider.prototype.saveDeposit = function(deposits, callback) {
    if( typeof deposits.length =="undefined") {
      deposits = [deposits];
    }
    
    for( var i =0;i< deposits.length;i++ ) {
      var deposit = deposits[i];
      deposit.created_at = new Date();
    }
    this.db.save(deposits, function(error, result) {
      if( error ) callback(error)
      else callback(null, deposits);
    });
};

exports.DataProvider = DataProvider;