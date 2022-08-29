const bestRouteQueryABI = require("../abis/mdexBestRouteQueryABI.json");

module.exports = {
  DECIMALS: 18,
  DISTRIBUTION_PERCENT: 5,
  SWAP_FEE: 1,
  ROUTING_CONTRACTS: {
    // 4: {
    //   Lable: "Rinkeby Testnet Network",
    //   SwapRoute: [3, 5],
    //   DexConfig: {
    //     3: { name: "Uniswap", fee: 0.3 },
    //     5: { name: "Curve Fi.", fee: 0.04 }
    //   },
    //   HttpProvider: "https://rinkeby.infura.io/v3/6a13b61cd14f4096aa7f4523785eff3e",
    //   ABIBestRouteQuery: bestRouteQueryABI,
    //   MultisigWallet: "0x33DcB383153bD106931911A4D81ac0DA719412B4",
    //   AddressBestRouteQuery: "0x92CA3294eB72b212e53Eb4b900d0D691f9cd4F4d",
    //   StableToken: "0x3FFc03F05D1869f493c7dbf913E636C6280e0ff9"
    // },
    5: {
      Lable: "Goerli Testnet Network",
      SwapRoute: [4, 5],
      DexConfig: {
        4: { name: "Curve Fi.", fee: 0.04 },
        5: { name: "Uniswap", fee: 0.3 }
      },
      HttpProvider: "https://goerli.infura.io/v3/6a13b61cd14f4096aa7f4523785eff3e",
      ABIBestRouteQuery: bestRouteQueryABI,
      MultisigWallet: "0x0b88D6D0c00a4399FA73B903E627Ec16e926eC53",
      AddressBestRouteQuery: "0xd19C6F58B9D06C0C3198993Ee9C34C08BA57195e",
      StableToken: "0x7ea6eA49B0b0Ae9c5db7907d139D9Cd3439862a1"
    },
    420: {
      Lable: "Optimism Goerli Testnet",
      SwapRoute: [0, 1],
      DexConfig: {
        0: { name: "Uniswap", fee: 0.3 },
        1: { name: "Curve Fi.", fee: 0.04 }
      },
      HttpProvider: "https://opt-goerli.g.alchemy.com/v2/urWmxbQMmnpzgfaleRxohQrcRF8RnHkf",
      ABIBestRouteQuery: bestRouteQueryABI,
      MultisigWallet: "0xB2468b3CF340D748774bb0139F835b1cFDA86F40",
      AddressBestRouteQuery: "0x6E4dF47ac4570789586d4E3dbc9423f3CeD5AC73",
      StableToken: "0x68Db1c8d85C09d546097C65ec7DCBFF4D6497CbF"
    }
  },
};