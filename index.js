/**
 * Bootstrap: load config, create Express app, start listening.
 * Register ts-node so require() can resolve .ts files (e.g. ports and adapters).
 * Use transpile-only register to avoid full program source-file resolution issues.
 */
require('ts-node/register/transpile-only');

const config = require('./config.js');
const app = require('./app.js');

app.listen(config.port, () => {
  console.log(`Guardian Integration Gateway listening on port ${config.port}`);
});
