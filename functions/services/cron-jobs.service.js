const cron = require("node-cron");
const ethers = require("ethers");
const ABI = require("../abis/multisig-abi.json");
const { ROUTING_CONTRACTS } = require("../utils/constants");

require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

cron.schedule("* * * * *", async function () {
  await syncOptimismGoerliWallet();
  await syncGoerliWallet();
});

const syncGoerliWallet = async () => {
  try {
    const httpProvider = ROUTING_CONTRACTS[5]["HttpProvider"];
    const goerliProvider = new ethers.providers.JsonRpcProvider(httpProvider)

    const goerliWallet = new ethers.Wallet(PRIVATE_KEY, goerliProvider);
    const goerliContract = new ethers.Contract(
      ROUTING_CONTRACTS[5].MultisigWallet,
      ABI,
      goerliWallet
    );
    const transactionStateQueue =
      await goerliContract.getTransactionStatusQueue();

    const blockNumber = await goerliProvider.getBlockNumber();
    const blockTimestamp = await goerliProvider.getBlock(blockNumber);

    if (transactionStateQueue.length > 0) {
      console.log("transaction state queue = ", transactionStateQueue.length);

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
  } catch (error) {
    return error
  }
}

const syncOptimismGoerliWallet = async () => {
  try {
    const httpProvider = ROUTING_CONTRACTS[420]["HttpProvider"];
    const optGoerliProvider = new ethers.providers.JsonRpcProvider(httpProvider);

    const optGoerliWallet = new ethers.Wallet(PRIVATE_KEY, optGoerliProvider);
    const optGoerliContract = new ethers.Contract(
      ROUTING_CONTRACTS[420].MultisigWallet,
      ABI,
      optGoerliWallet
    );
    const transactionStateQueue =
      await optGoerliContract.getTransactionStatusQueue();

    const blockNumber = await optGoerliProvider.getBlockNumber();
    const blockTimestamp = await optGoerliProvider.getBlock(blockNumber);

    if (transactionStateQueue.length > 0) {
      console.log("transaction state queue = ", transactionStateQueue.length);

      for (let i = 0; i <= transactionStateQueue.length; i++) {
        let convertBlockTimeStamp = ethers.BigNumber.from(
          transactionStateQueue[i].timestamp
        ).toNumber();

        if (
          transactionStateQueue[i].status == 2 &&
          convertBlockTimeStamp <= blockTimestamp.timestamp
        ) {
          await optGoerliContract.updateTransaction(
            ethers.BigNumber.from(transactionStateQueue[i].id).toNumber()
          );
        } else {
          return true;
        }
      }
    } else {
      return true;
    }
  } catch (error) {
    return error
  }
}

