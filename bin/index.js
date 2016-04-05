#! /usr/bin/env node
const client = require('../index.js');
const colors = require('colors/safe');
const argv = require('minimist')(process.argv.slice(2));

const usage = 'Use: magnet-blacklist --urls=<url>[,<url2>,<url3>]';

if (!argv['urls']) {
  console.log(usage);
  process.exit(1);
}

const urls = argv['urls'].split(',').map((url) => url.trim());

client.init().checkUrls(urls)
  .then((result) => {
    urls.forEach((url, index) => {
      if (result[index]) {
        console.log(colors.red(`${url} is blacklisted.`));
      } else {
        console.log(colors.green(`${url} is not blacklisted.`));
      }
    });
    process.exit(0);
  });
