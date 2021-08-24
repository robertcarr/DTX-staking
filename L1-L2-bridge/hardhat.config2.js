// Plugins
require('@nomiclabs/hardhat-ethers')
//require('@eth-optimism/hardhat-ovm')
require("@nomiclabs/hardhat-waffle");
//require("@eth-optimism/plugins/hardhat/compiler")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const ALCHEMY_API_KEY = "NMpwWtzFJUxOEqIPb92mX3m2ycNqXo2V";
const privateKey = 'd90cc59beb0c576b196af29946e36ead3819bee58abde0adb4a4708861b70037';

module.exports = {
  networks: {
    hardhat: {
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      }
    },
    // Add this network to your config!
    optimism: {
      url: 'http://127.0.0.1:7545',
      accounts: { mnemonic: 'test test test test test test test test test test test junk' },
      gasPrice: 15000000,          
      ovm: true // This sets the network as using the ovm and ensure contract will be compiled against that.
      },
    "optimistic-kovan": {
      url: `https://opt-kovan.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${privateKey}`],
      gas: 2100000,
      gasPrice: 15000000,
      ovm: true
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${privateKey}`],
      gas: 'auto',
      gasPrice: 'auto',
      ovm: true
    }
  },
  solidity: '0.7.0',
  ovm: {
    solcVersion: '0.7.0'
  }
}