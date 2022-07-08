const express = require("express");
const app = express();
const config = require('./configs/app')

// Cron job
require("./services/cron-jobs");

// Express Configs
require('./configs/express')(app)

// Routes
app.use(require('./routes'))

// Start Server
const server = app.listen( config.port, () => {
  let port = server.address().port
  console.log(`Cron-job and API server start on port: ${port}`);
})