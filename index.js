var Cobweb  = require('cobweb');
var compose = require('cobweb-compose');
var co      = require('co');
var limiter = require('co-limiter');
var cobweb  = Cobweb.prototype;

// Queue Class

var Queue = module.exports = function Queue () {
  var self = this instanceof Queue ? this : Object.create(queue);
  self.initialize.apply(self, arguments);
  return self;
}

// Queue Prototype

var queue = Queue.prototype = Object.create(cobweb);

queue.initialize = function (concurrency, middleware) {
  cobweb.initialize.call(this, middleware);
  this.queue = limiter(concurrency || 10);
}

queue.add = function (input, callback, priority) {
  if (!Array.isArray(input)) input = [input];
  co(function* (self) {
    var contexts = input.map(function (item) {
      return self.createContext(item);
    });
    yield contexts.map(function (ctx) {
      return function (done) {
        var mwf = co(compose(self.middleware));
        self.queue(mwf.bind(ctx), priority || 1)(done);
      }
    });
    if (callback) callback.call(self, contexts);
  })(this);
  return this;
}

// Queue Context

var context = queue.context = Object.create(cobweb.context);

context.add = function (input, callback, priority) {
  this.parent.add(input, callback, priority);
}
