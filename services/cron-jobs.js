const cron = require("node-cron");
const ethers = require("ethers");
const ABI = require("../abis/multisig-abi.json");
const { ROUTING_CONTRACTS } = require("../utils/constants");

require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

cron.schedule("5 * * * * *", async function () {
  //Rinkeby
  const rinkebyProvider = ethers.getDefaultProvider(
    ethers.providers.getNetwork(4)
  );
  const rinkebyWallet = new ethers.Wallet(PRIVATE_KEY, rinkebyProvider);
  const rinkebyContract = new ethers.Contract(
    ROUTING_CONTRACTS[4].MultisigWallet,
    ABI,
    rinkebyWallet
  );
  const transactionStateQueue =
    await rinkebyContract.getTransactionStatusQueue();

  const blockNumber = await rinkebyProvider.getBlockNumber();
  const blockTimestamp = await rinkebyProvider.getBlock(blockNumber);

  if (transactionStateQueue.length > 0) {
    for (let i = 0; i <= transactionStateQueue.length; i++) {
      let convertBlockTimeStamp = ethers.BigNumber.from(
        transactionStateQueue[i].timestamp
      ).toNumber();

      if (
        transactionStateQueue[i].status == 2 &&
        convertBlockTimeStamp <= blockTimestamp.timestamp
      ) {
        await rinkebyContract.updateTransaction(
          ethers.BigNumber.from(transactionStateQueue[i].id).toNumber()
        );
      } else {
        return true;
      }
    }
  } else {
    return true;
  }

  console.log("Run Cron Job Rinkeby Network: ", PRIVATE_KEY);

  //Goerli
  const goerliProvider = ethers.getDefaultProvider(
    ethers.providers.getNetwork(5)
  );
  const goerliWallet = new ethers.Wallet(PRIVATE_KEY, goerliProvider);
  const goerliContract = new ethers.Contract(
    ROUTING_CONTRACTS[5].MultisigWallet,
    ABI,
    goerliWallet
  );

  const transactionStateQueue =
    await goerliContract.getTransactionStatusQueue();

  const blockNumber = await rinkebyProvider.getBlockNumber();
  const blockTimestamp = await rinkebyProvider.getBlock(blockNumber);

  if (transactionStateQueue.length > 0) {
    for (let i = 0; i <= transactionStateQueue.length; i++) {
      let convertBlockTimeStamp = ethers.BigNumber.from(
        transactionStateQueue[i].timestamp
      ).toNumber();

      if (
        transactionStateQueue[i].status == 2 &&
        convertBlockTimeStamp <= blockTimestamp.timestamp
      ) {
        await goerliContract.updateTransaction(
          ethers.BigNumber.from(transactionStateQueue[i].id).toNumber()
        );
      } else {
        return true;
      }
    }
  } else {
    return true;
  }

  console.log("Run Cron Job Goerli Network: ", PRIVATE_KEY);
});
