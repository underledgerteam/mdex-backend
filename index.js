const express = require("express");
const app = express();
const updateStateTransaction = require("./services/cron-jobs");
require("./services/cron-jobs");

app.listen(9000, () => {
  console.log(`Server start on port: 3000`);
});
