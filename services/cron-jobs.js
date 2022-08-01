const cron = require("node-cron");
const ethers = require("ethers");
const ABI = require("../abis/multisig-abi.json");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

cron.schedule("* * * * *", async function () {
  const CONTRACT_ADDRESS = "0xb236416f41e82884F6311065ad00b2F853dF436F";
  const provider = ethers.getDefaultProvider(ethers.providers.getNetwork(4));
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  await contract.uppdateData();

  console.log("Run Cron Job", PRIVATE_KEY);
});
