const cron = require("node-cron");
const ethers = require("ethers");
const ABI = require("../abis/multisig-abi.json");
const { ROUTING_CONTRACTS } = require("../utils/constants");

require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

cron.schedule("* * * * *", async function () {
  //Rinkeby
  const rinkebyProvider = ethers.getDefaultProvider(ethers.providers.getNetwork(4));
  const rinkebWallet = new ethers.Wallet(PRIVATE_KEY, rinkebyProvider);
  const rinkebContract = new ethers.Contract(ROUTING_CONTRACTS[4].MultisigWallet, ABI, rinkebWallet);

  await rinkebContract.uppdateData();

  console.log("Run Cron Job Rinkeby Network: ", PRIVATE_KEY);

  //Goerli
  const goerliProvider = ethers.getDefaultProvider(ethers.providers.getNetwork(5));
  const goerliWallet = new ethers.Wallet(PRIVATE_KEY, goerliProvider);
  const goerliContract = new ethers.Contract(ROUTING_CONTRACTS[5].MultisigWallet, ABI, goerliWallet);

  await goerliContract.uppdateData();

  console.log("Run Cron Job Goerli Network: ", PRIVATE_KEY);
});
