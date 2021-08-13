const { expect } = require('chai');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const Staking = artifacts.require('Staking');
const DTX = artifacts.require('DTX');
const { utils } = require('ethers');

contract('Staking (proxy)', function (accounts) {
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
  });

  it('getTotalStakeholders returns a correct value when contract deployed via proxy pattern', async function () {
    expect((await this.staking.getTotalStakeholders()).toString()).to.equal(
      '1'
    );
  });
});
