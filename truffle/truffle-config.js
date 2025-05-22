require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Ganache 로컬
      port: 8545,
      network_id: "*"
    },
    sepolia: {
      provider: () =>
        new HDWalletProvider(process.env.PRIVATE_KEY, `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`),
      network_id: 11155111,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    kairos: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, 'https://public-en-kairos.node.kaia.io'),
      network_id: 1001,
      gas: 6000000,
      gasPrice: 25000000000, // 25 Gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },
  compilers: {
    solc: {
      version: "0.8.20"
    }
  }
};
