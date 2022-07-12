require('dotenv').config()

module.exports = {
    uniswapFactoryABI: require('../abis/UniswapFactoryABI.json'),
    uniswapPairABI: require('../abis/UniswapPairABI.json'),
    uniswapRouteABI: require('../abis/UniswapRouterABI.json'),
    
    // Rinkeby
    rinkebyUniswapRouterContract: '0xB7f3bcBB70664491D42aaE295F74ec0e0ec77848',
    rinkebyUniswapFactoryContract: '0x8d4a32680361206C56a09DbadB048337Fe0fdF10',
    rinkebyUniswapRouterContract: '0xB7f3bcBB70664491D42aaE295F74ec0e0ec77848'
}