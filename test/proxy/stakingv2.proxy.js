const { expect } = require('chai');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const Staking = artifacts.require('Staking');
const StakingV2 = artifacts.require('StakingV2');
const DTX = artifacts.require('DTX');
const { utils } = require('ethers');

contract('StakingV2 (proxy)', function (accounts) {
  const [superAdmin, admin, staker1] = accounts;

  beforeEach(async function () {
    this.dtxInstance = await DTX.new(utils.parseUnits('999999'), {
      from: superAdmin,
    });

    this.staking = await deployProxy(
      Staking,
      [superAdmin, admin, this.dtxInstance.address],
      {
        initializer: 'initialize',
        kind: 'uups',
      }
    );

    this.staking = await deployProxy(
      Staking,
      [superAdmin, admin, this.dtxInstance.address],
      {
        initializer: 'initialize',
        kind: 'uups',
      }
    );

    await this.dtxInstance.transfer(superAdmin, web3.utils.toWei('1000'), {
      from: superAdmin,
    });

    await this.dtxInstance.approve(
      this.staking.address,
      web3.utils.toWei('1000'),
      {
        from: superAdmin,
      }
    );

    await this.staking.setInitialRatio(web3.utils.toWei('1000'), {
      from: superAdmin,
    });

    // upgrade staking contract
    this.stakingV2 = await upgradeProxy(this.staking.address, StakingV2);
  });

  it('Should be able to call the newly added function and return appropriate value', async function () {
    expect(
      (await this.stakingV2.newGetTotalStakeholders()).toString()
    ).to.equal('101');
  });
});