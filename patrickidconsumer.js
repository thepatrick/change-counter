/*global escape Buffer*/

var msgpack = require('msgpack-0.4'),
    crypto  = require('crypto'),
    http    = require('http'),
    util    = require('util');

var Consumer = function(auth_server, service_id, shared_secret) {
  this.auth_server = auth_server;
  this.service_id = service_id;
  this.shared_secret = shared_secret;
  return this;
};

Consumer.prototype.login_url = function(return_url, cancel_url) {
  return "http://" + this.auth_server + "/authenticate?service=" + escape(this.service_id) + "&returnURL=" + escape(return_url) + "&cancelURL=" + escape(cancel_url || "/");
};

Consumer.prototype.retrieve_token_url = function (token_id) {
  return {
    host: this.auth_server,
    port: 80,
    path: "/authorize/token?token=" + escape(token_id) + "&service=" + escape(this.service_id)
  };
};

Consumer.prototype.retrieve_details = function(token_id, callback) {
  http.get(this.retrieve_token_url(token_id), function(res){
    var data;
    res.on('data', function(chunk){
      data = data && (data + chunk) || chunk;
    }).on('end', function(){
      try {
        var msg = msgpack.unpack(data);
        var payload = new Buffer(msg.payload, 'base64').toString('binary');
        var iv = new Buffer(msg.iv, 'base64').toString('binary');
        var res = this.decrypt_payload(payload, iv);
        res = JSON.parse(res);
        if(res.application != this.service_id) {
          res = null;
        }
        callback(res);
      } catch(e) {
        console.log("Failed to fetch key: ", e);
        callback(null);
      }
    }.bind(this));
  }.bind(this)).on('error', function(e){
    console.log("retrieve_details error: " + e.message);
    callback(null);    
  });
};

Consumer.prototype.encryptionKey = function() {
  var shasum = crypto.createHash('sha512');
  shasum.update(this.shared_secret);
  return shasum.digest().substring(0,32);
};

Consumer.prototype.decrypt_payload = function(payload, iv) {
  var decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey(), iv);
  var txt = decipher.update(payload);
  txt += decipher.final();
  return txt;
};

module.exports = Consumer;