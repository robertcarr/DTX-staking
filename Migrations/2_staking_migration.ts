import { StakingContract } from '../types/truffle-contracts';
import { DTXContract } from '../types/truffle-contracts';
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const Staking: StakingContract = artifacts.require('./Staking.sol');
const DTX: DTXContract = artifacts.require('./DTX.sol');

module.exports = async function (deployer: any) {
  try {
    const admin1 = '0x59159f5620054237a4Ad66B560b7D8F91D76163f'; // TODO: Update
    const admin2 = '0xF4Dab459866De6792E49E1e932976F32f7d11D27'; // TODO: Update
    const dtxTokenAddress = '0xA2413A9B711BB3bb2508B1A5122640c03ca7E0aB'; // TODO: Update

    const stakingInstance = await deployProxy(
      Staking,
      [admin1, admin2, dtxTokenAddress],
      {
        deployer,
        kind: 'uups',
      }
    );
    console.log('Deployed', stakingInstance.address);

    const dtxInstance = await DTX.at(dtxTokenAddress);

    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: admin1,
      }
    );

    const tx = await stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
      from: admin1,
    });

    console.log('setInitialRatio transaction', tx.tx);
  } catch (err) {
    console.log('err', err);
  }
};
