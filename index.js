/**
 * Bootstrap: load config, create Express app, start listening.
 */

const config = require('./config.js');
const app = require('./app.js');

app.listen(config.port, () => {
  console.log(`Guardian Integration Gateway listening on port ${config.port}`);
});
