const config = require('yajsonfig')(__dirname + '/config.json');
const Redis = require('ioredis');
const URL = require('url');

const client = {
  redis: null,
  init: function(cfg) {
    cfg = cfg || config;
    client.redis = new Redis(cfg);
    return client;
  },
  checkInitialized: function() {
    if (client.redis !== null) {
      return true;
    }

    throw new Error('Not initialized');
  },
  checkUrls: function(urls) {
    client.checkInitialized();
    urls = Array.isArray(urls) ? urls : [urls];
    const alternatives = urls.map((url) => {
      return client.getAlternatives(url);
    });

    return client.__check(alternatives)
      .then((results) => {
        return results.map((result) => {
          return result.reduce((prev, current) => {
            return prev ? prev : current[1] > 0;
          }, false);
        });
      });
  },
  __check: function(urls) {
    client.checkInitialized();
    var tasks = [];
    urls.forEach((alternatives) => {
      const pipeline = client.redis.pipeline();
      alternatives.forEach((url) => {
        pipeline.exists(url);
      });
      tasks.push(pipeline.exec());
    });
    return Promise.all(tasks);
  },
  getAlternatives: function(url) {
    const urlObject = URL.parse(url, true, true);
    var alternatives = [url];
    if (urlObject.hostname) {
      alternatives.push(urlObject.hostname);
    }
    if (urlObject.pathname && urlObject.hostname) {
      const fn1 = `${urlObject.hostname}${urlObject.pathname}`;
      if (alternatives.indexOf(fn1) === -1) {
        alternatives.push(fn1);
      }
    }
    if (urlObject.protocol) {
      const fn2 = `${urlObject.protocol}//${urlObject.hostname}${urlObject.pathname}`;
      if (alternatives.indexOf(fn2) === -1) {
        alternatives.push(fn2);
      }
    }

    return alternatives;
  }
};

module.exports = client;
