const PrivateKeyProvider = require('truffle-privatekey-provider');
const HDWalletProvider = require('truffle-hdwallet-provider');
const solcconfig = require('./solcconfig.json');

require('dotenv').config();

module.exports = {
  plugins: ['solidity-coverage'],
  migrations_directory: './dist/migrations',
  networks: {
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
    },
    goerli: {
      provider: () => {
        return new PrivateKeyProvider(
          process.env.PRIVATE_KEY,
          `https://goerli.infura.io/v3/${process.env.INFURA_ID}`
        );
      },
      network_id: '5', // eslint-disable-line camelcase
      gas: 4465030,
      gasPrice: 10000000000,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      excludeContracts: ['Migrations'],
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: solcconfig.version,
      settings: {
        optimizer: solcconfig.optimizer,
        evmVersion: solcconfig.evmVersion,
      },
    },
  },

  db: {
    enabled: false,
  },
};
