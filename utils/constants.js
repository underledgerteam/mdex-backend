const controllerABI = require("../abis/mdexControllerABI.json");
const bestRouteQueryABI = require("../abis/mdexBestRouteQueryABI.json");

module.exports = {
	DISTRIBUTION_PERCENT: 5,
	MAX_ROUTE: 2,
	SWAP_FEE: 1,
	ROUTES: [0, 1],

	ROUTING_NAME: {
		0: "Uniswap",
		1: "Curve Fi."
	},

	ROUTING_CONTRACTS: {
		4: {
			Lable: "Rinkeby Testnet Network",

			ABIController: controllerABI,
			ABIBestRouteQuery: bestRouteQueryABI,

			AddressController: "0x165834eDd4A46B2Bc343f5Be824B403849728E95",
			AddressBestRouteQuery: "0x3e14fe391F3B89A5baE68D9F807379B0A586731c"
		}
	}
}