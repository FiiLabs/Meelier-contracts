require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config();
require("hardhat-gas-reporter")
require("solidity-coverage")
const { API,NETWORK, PRIVATE_KEY, ETHERSCAN_KEY } = process.env;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {

  defaultNetwork: NETWORK,
  solidity: {
      compilers: [
          {
              version: '0.8.19',
              settings: {
                  optimizer: {
                      enabled: true,
                      runs: 200,
                  },
              },
          },
      ],
  },
  networks: {
    hardhat: {
      initialDate:'01 Jan 1970 00:00:00 GMT',
    },
    goerli: {
      url: API,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    sepolia: {
      url: API,
      accounts: [`0x${PRIVATE_KEY}`]
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY
  },
  gasReporter: {
    enabled: false,
    // outputFile: "gas-reporter.txt",
    noColors: true,
    currency: "USD",
    // coinmarketcap: COINMARKETCAP_API_KEY,
    token: "ETH",
},
};
