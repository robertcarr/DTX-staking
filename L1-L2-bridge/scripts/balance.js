const hre = require("hardhat")
const ethers = require('ethers')
const { Watcher } = require('@eth-optimism/watcher')
const { predeploys, getContractInterface } = require('@eth-optimism/contracts')

// Set up some contract factories. You can ignore this stuff.
const erc20L1Artifact = require(`../artifacts/contracts/ERC20.sol/ERC20.json`)
const factory__L1_ERC20 = new ethers.ContractFactory(erc20L1Artifact.abi, erc20L1Artifact.bytecode)
//const factory__L1_ERC20 = factory('ERC20')
const erc20L2Artifact = require('@eth-optimism/contracts/artifacts-ovm/contracts/optimistic-ethereum/libraries/standards/L2StandardERC20.sol/L2StandardERC20')
const factory__L2_ERC20 = new ethers.ContractFactory(erc20L2Artifact.abi, erc20L2Artifact.bytecode)

const l1StandardBridgeArtifact = require(`@eth-optimism/contracts/artifacts/contracts/optimistic-ethereum/OVM/bridge/tokens/OVM_L1StandardBridge.sol/OVM_L1StandardBridge`)
const factory__L1StandardBridge = new ethers.ContractFactory(l1StandardBridgeArtifact.abi, l1StandardBridgeArtifact.bytecode)

const l2StandardBridgeArtifact = require(`@eth-optimism/contracts/artifacts/contracts/optimistic-ethereum/OVM/bridge/tokens/OVM_L2StandardBridge.sol/OVM_L2StandardBridge`)
const factory__L2StandardBridge = new ethers.ContractFactory(l2StandardBridgeArtifact.abi, l2StandardBridgeArtifact.bytecode)

async function main() {
  const l1RpcProvider = new ethers.providers.JsonRpcProvider('http://localhost:9545')
  const l2RpcProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

  const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  const l1Wallet = new ethers.Wallet(key, l1RpcProvider)
  const l2Wallet = new ethers.Wallet(key, l2RpcProvider)

  const l2AddressManager = new ethers.Contract(
    predeploys.Lib_AddressManager,
    getContractInterface('Lib_AddressManager'),
    l2RpcProvider
  )

  const l1Messenger = new ethers.Contract(
    await l2AddressManager.getAddress('OVM_L1CrossDomainMessenger'),
    getContractInterface('OVM_L1CrossDomainMessenger'),
    l1RpcProvider
  )

  const l1MessengerAddress = l1Messenger.address
  // L2 messenger address is always the same.
  const l2MessengerAddress = '0x4200000000000000000000000000000000000007'

  // Tool that helps watches and waits for messages to be relayed between L1 and L2.
  const watcher = new Watcher({
    l1: {
      provider: l1RpcProvider,
      messengerAddress: l1MessengerAddress
    },
    l2: {
      provider: l2RpcProvider,
      messengerAddress: l2MessengerAddress
    }
  })


  // Deploy the Bank SC
  const Bank = await hre.ethers.getContractFactory("Bank");
  const bank = await Bank.deploy('0x4361d0F75A0186C05f971c566dC6bEa5957483fD');

  await bank.deployed();

  console.log("Bank deployed to:", bank.address);

  // Deploy the paired ERC20 token to L2.
  console.log('Deploying L2 ERC20...')
  const L2_ERC20 = await factory__L2_ERC20.connect(l2Wallet).deploy(
    '0x4200000000000000000000000000000000000010',
    bank.address,
    'L2 ERC20', //name
    'L2T', // symbol
  )
  await L2_ERC20.deployTransaction.wait()

  const L2StandardBridge = factory__L2StandardBridge
      .connect(l2Wallet)
      .attach('0x4200000000000000000000000000000000000010')


  // Initial balances.
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l1Wallet.address)}`) // 0

  const tx1 = await L2_ERC20.mint(L2_ERC20.address, 1234, {
    gasLimit: 7380000,
    gasPrice: 15000000
  });
  
  //await tx1.wait();

  // After balances.
  //console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l1Wallet.address)}`) // 0

  const balanceL2 = await bank.balanceL2(l1Wallet.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });