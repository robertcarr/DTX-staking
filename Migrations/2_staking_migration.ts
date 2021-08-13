import { StakingContract } from '../types/truffle-contracts';
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const Staking: StakingContract = artifacts.require('./Staking.sol');

module.exports = async function (deployer: any) {
  try {
    const superAdmin = '0x4B41FFfC23de50979aD3135F90720702Cc1b8da8'; // TODO: Update
    const admin = '0x4B41FFfC23de50979aD3135F90720702Cc1b8da8'; // TODO: Update
    const dtxToken = '0x4B41FFfC23de50979aD3135F90720702Cc1b8da8'; // TODO: Update

    const stakingInstance = await deployProxy(
      Staking,
      [superAdmin, admin, dtxToken],
      {
        deployer,
      }
    );

    console.log('Deployed', stakingInstance.address);
  } catch (err) {
    console.log('err', err);
  }
};
