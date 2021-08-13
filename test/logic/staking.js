const { expect } = require('chai');
const Staking = artifacts.require('Staking');
const DTX = artifacts.require('DTX');
const { utils } = require('ethers');
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Staking V3', async (accounts) => {
  let stakingInstance;
  let dtxInstance;
  const [owner, staker1, staker2, staker3, staker4, staker5] = accounts;
  const admin = staker1;
  const base = 10 ** 18;

  beforeEach(async () => {
    dtxInstance = await DTX.new(utils.parseUnits('999999'), {
      from: owner,
    });

    stakingInstance = await Staking.new();
    await stakingInstance.initialize(staker1, owner, dtxInstance.address, {
      from: owner,
    });

    await dtxInstance.transfer(staker1, web3.utils.toWei('500'), {
      from: owner,
    });
    await dtxInstance.transfer(staker2, web3.utils.toWei('1000'), {
      from: owner,
    });
    await dtxInstance.transfer(staker3, web3.utils.toWei('500'), {
      from: owner,
    });
    await dtxInstance.transfer(staker4, web3.utils.toWei('500'), {
      from: owner,
    });
    await dtxInstance.transfer(staker5, '1', {
      from: owner,
    });
  });

  /*
   * Scenario covered in excel
   * https://docs.google.com/spreadsheets/d/11yU9c4G4PJ50dzmtILRMYd5w_qO-qCa2cM0ZOWJXfsA/edit#gid=0
   * Cases includes -
   * Withdraw all stakes and re-stake
   * Withdraw partial stakes
   * Create stake on partially withdrawn stakes
   * Create and withdraw stakes when no rewards been added in between create and withdraw
   */
  it('scenario1', async () => {
    let staker3Balance = 0;
    let staker4Balance = 0;
    let totalRewardsDistributed = 0;

    // Staker1 create a stake of 500 DTX
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker1,
      }
    );
    await stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
      from: staker1,
    });

    // Staker2 create a stake of 1000 DTX
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('1000'),
      {
        from: staker2,
      }
    );
    await stakingInstance.createStake(web3.utils.toWei('1000'), {
      from: staker2,
    });

    // Staker3 create a stake of 500 DTX
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker3,
      }
    );
    await stakingInstance.createStake(web3.utils.toWei('500'), {
      from: staker3,
    });

    // Add platform rewards of 100 DTX
    await dtxInstance.transfer(
      stakingInstance.address,
      web3.utils.toWei('100'),
      { from: owner }
    );

    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      '1050000000000000000'
    );

    // Staker1 withdraws 500 DTX
    await stakingInstance.removeStake(web3.utils.toWei('500'), {
      from: staker1,
    });

    totalRewardsDistributed += parseInt(web3.utils.toWei('25'));

    expect((await dtxInstance.balanceOf(staker1)).toString()).to.be.equal(
      web3.utils.toWei('525')
    );
    expect((await stakingInstance.stakeOf(staker1)).toString()).to.be.equal(
      '0'
    );
    expect((await stakingInstance.sharesOf(staker1)).toString()).to.be.equal(
      '0'
    );
    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      '1050000000000000000'
    );

    // Staker2 withdraws 1000 DTX
    await stakingInstance.removeStake(web3.utils.toWei('1000'), {
      from: staker2,
    });

    totalRewardsDistributed += parseInt(web3.utils.toWei('50'));

    expect((await dtxInstance.balanceOf(staker2)).toString()).to.be.equal(
      web3.utils.toWei('1050')
    );
    expect((await stakingInstance.stakeOf(staker2)).toString()).to.be.equal(
      '0'
    );
    expect((await stakingInstance.sharesOf(staker2)).toString()).to.be.equal(
      '0'
    );
    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      '1050000000000000000'
    );

    // Scenario - staker4 stake and withdraw before the next reward
    // Staker4 stakes 500 DTX
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker4,
      }
    );
    await stakingInstance.createStake(web3.utils.toWei('500'), {
      from: staker4,
    });

    expect(parseInt(await stakingInstance.sharesOf(staker4))).to.be.equal(
      476190476190476200000
    );

    // Staker4 withdraws 500 DTX
    await stakingInstance.removeStake(web3.utils.toWei('500'), {
      from: staker4,
    });

    staker4Balance += 500000000000000000000;
    totalRewardsDistributed += parseInt(web3.utils.toWei('0'));

    expect((await dtxInstance.balanceOf(staker4)).toString()).to.be.equal(
      staker4Balance.toString()
    );

    // Staker3 withdraws 250 DTX
    await stakingInstance.removeStake(web3.utils.toWei('250'), {
      from: staker3,
    });

    staker3Balance += 262500000000000000000;
    totalRewardsDistributed += parseInt(web3.utils.toWei('12.5'));

    expect((await dtxInstance.balanceOf(staker3)).toString()).to.be.equal(
      '262500000000000000000'
    );
    expect((await stakingInstance.stakeOf(staker3)).toString()).to.be.equal(
      '250000000000000000000'
    );
    expect((await stakingInstance.sharesOf(staker3)).toString()).to.be.equal(
      '250000000000000000000'
    );
    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      '1050000000000000000'
    );

    // Staker4 stakes 500 DTX
    await dtxInstance.transfer(staker4, web3.utils.toWei('500'), {
      from: owner,
    });
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker4,
      }
    );
    await stakingInstance.createStake(web3.utils.toWei('500'), {
      from: staker4,
    });

    expect((await stakingInstance.stakeOf(staker4)).toString()).to.be.equal(
      web3.utils.toWei('500')
    );
    expect((await stakingInstance.sharesOf(staker4)).toString()).to.be.equal(
      '476190476190476190476'
    );
    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      '1050000000000000000'
    );

    // Add platform rewards of 100 DTX
    await dtxInstance.transfer(
      stakingInstance.address,
      web3.utils.toWei('100'),
      { from: owner }
    );

    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      '1187704918032786885'
    );

    // Staker3 stakes 500 DTX
    await dtxInstance.transfer(staker3, web3.utils.toWei('500'), {
      from: owner,
    });
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker3,
      }
    );
    await stakingInstance.createStake(web3.utils.toWei('500'), {
      from: staker3,
    });

    expect((await stakingInstance.stakeOf(staker3)).toString()).to.be.equal(
      web3.utils.toWei('750')
    );
    expect(parseInt(await stakingInstance.sharesOf(staker3))).to.be.equal(
      670979986197377400000
    );
    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      '1187704918032786885'
    );

    // Staker4 withdraws 500 DTX
    await stakingInstance.removeStake(web3.utils.toWei('500'), {
      from: staker4,
    });

    totalRewardsDistributed += 6.557377049e19;

    expect(
      parseInt(await dtxInstance.balanceOf(staker4)) - staker4Balance
    ).to.be.equal(565573770491803340000);

    // Staker3 withdraws 500 DTX
    await stakingInstance.removeStake(web3.utils.toWei('500'), {
      from: staker3,
    });

    expect(
      parseInt(await dtxInstance.balanceOf(staker3)) - staker3Balance
    ).to.be.equal(531284153005464500000);

    staker3Balance += 531284153005464500000;
    totalRewardsDistributed += 3.128415301e19;

    // Staker3 withdraws 250 DTX
    await stakingInstance.removeStake(web3.utils.toWei('250'), {
      from: staker3,
    });
    totalRewardsDistributed += 1.56420765e19;

    expect(
      parseInt(await dtxInstance.balanceOf(staker3)) - staker3Balance
    ).to.be.equal(265642076502732180000);

    expect(totalRewardsDistributed).to.be.equal(
      parseInt(web3.utils.toWei('200'))
    );
  });

  /*
   * Stake amount less than base 10^18 DTX
   * Staker5 stakes and withdraws 1 wei DTX
   */
  it('scenario2', async () => {
    // Staker1 create a stake of 500 DTX
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker1,
      }
    );
    await stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
      from: staker1,
    });

    // Staker2 create a stake of 1000 DTX
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('1000'),
      {
        from: staker2,
      }
    );
    await stakingInstance.createStake(web3.utils.toWei('1000'), {
      from: staker2,
    });

    // Staker3 create a stake of 500 DTX
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker3,
      }
    );
    await stakingInstance.createStake(web3.utils.toWei('500'), {
      from: staker3,
    });

    // Staker5 create a stake of 1 wei DTX
    await dtxInstance.approve(stakingInstance.address, '1', {
      from: staker5,
    });
    await stakingInstance.createStake('1', {
      from: staker5,
    });

    // Add platform rewards of 100 DTX
    await dtxInstance.transfer(
      stakingInstance.address,
      web3.utils.toWei('100'),
      { from: owner }
    );

    // Staker5 withdraws 1 wei DTX
    await stakingInstance.removeStake('1', {
      from: staker5,
    });

    console.log(
      'balanceOf staker5',
      parseInt(await dtxInstance.balanceOf(staker5))
    );

    // Staker1 withdraws 500 DTX
    await stakingInstance.removeStake(web3.utils.toWei('500'), {
      from: staker1,
    });

    expect((await dtxInstance.balanceOf(staker1)).toString()).to.be.equal(
      web3.utils.toWei('525')
    );
    expect((await stakingInstance.stakeOf(staker1)).toString()).to.be.equal(
      '0'
    );
    expect((await stakingInstance.sharesOf(staker1)).toString()).to.be.equal(
      '0'
    );
    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      '1050000000000000000'
    );

    // Staker2 withdraws 1000 DTX
    await stakingInstance.removeStake(web3.utils.toWei('1000'), {
      from: staker2,
    });

    expect((await dtxInstance.balanceOf(staker2)).toString()).to.be.equal(
      web3.utils.toWei('1050')
    );
    expect((await stakingInstance.stakeOf(staker2)).toString()).to.be.equal(
      '0'
    );
    expect((await stakingInstance.sharesOf(staker2)).toString()).to.be.equal(
      '0'
    );
    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      '1050000000000000000'
    );
  });

  it('should not be able to reinitialize the contract', async () => {
    await expectRevert(
      stakingInstance.initialize(staker1, owner, dtxInstance.address, {
        from: owner,
      }),
      'Initializable: contract is already initialized -- Reason given: Initializable: contract is already initialized'
    );
  });

  it('should be able to pause and unpause the contract', async () => {
    await stakingInstance.pauseContract({ from: admin });

    // Staker1 create a stake of 500 DTX
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker1,
      }
    );
    await stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
      from: staker1,
    });
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('1000'),
      {
        from: staker2,
      }
    );

    await expectRevert(
      stakingInstance.createStake(web3.utils.toWei('1000'), {
        from: staker2,
      }),
      'Pausable: paused -- Reason given: Pausable: paused'
    );

    await stakingInstance.unPauseContract({ from: admin });
    await stakingInstance.createStake(web3.utils.toWei('1000'), {
      from: staker2,
    });
    expect((await stakingInstance.stakeOf(staker2)).toString()).to.be.equal(
      web3.utils.toWei('1000')
    );

    // Pause unpause for removeStake
    await stakingInstance.pauseContract({ from: admin });

    await expectRevert(
      stakingInstance.removeStake(web3.utils.toWei('1000'), {
        from: staker2,
      }),
      'Pausable: paused -- Reason given: Pausable: paused'
    );

    await stakingInstance.unPauseContract({ from: admin });
    await stakingInstance.removeStake(web3.utils.toWei('1000'), {
      from: staker2,
    });
    expect((await dtxInstance.balanceOf(staker2)).toString()).to.be.equal(
      web3.utils.toWei('1000')
    );
  });

  it('setInitialRatio should revert if not called by admin', async () => {
    await expectRevert(
      stakingInstance.setInitialRatio(web3.utils.toWei('1000'), {
        from: staker2,
      }),
      'Caller is not an admin -- Reason given: Caller is not an admin'
    );
  });

  it('setInitialRatio should revert if totalStakes and totalShares are not 0', async () => {
    await dtxInstance.transfer(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: owner,
      }
    );

    await expectRevert(
      stakingInstance.setInitialRatio(web3.utils.toWei('1000'), {
        from: admin,
      }),
      'Stakes and shares are non-zero -- Reason given: Stakes and shares are non-zero.'
    );
  });

  it('removeStake should revert if input amount is greater than staked amount', async () => {
    await expectRevert(
      stakingInstance.removeStake(web3.utils.toWei('1000'), {
        from: staker2,
      }),
      'Not enough staked! -- Reason given: Not enough staked!'
    );
  });

  it('should be able to get correct dtx per share ratio', async () => {
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: admin,
      }
    );
    await stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
      from: admin,
    });

    await dtxInstance.transfer(
      stakingInstance.address,
      web3.utils.toWei('100'),
      {
        from: owner,
      }
    );

    const expectedRatio =
      ((parseInt(web3.utils.toWei('500')) + parseInt(web3.utils.toWei('100'))) *
        base) /
      parseInt(web3.utils.toWei('500'));

    expect((await stakingInstance.getDtxPerShare()).toString()).to.be.equal(
      expectedRatio.toString()
    );
  });

  it('should calculate the correct reward for stakeholder', async () => {
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: admin,
      }
    );
    await stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
      from: admin,
    });

    await dtxInstance.transfer(
      stakingInstance.address,
      web3.utils.toWei('100'),
      {
        from: owner,
      }
    );

    expect((await stakingInstance.getCurrentRewards()).toString()).to.be.equal(
      web3.utils.toWei('100')
    );

    const shares = parseInt(await stakingInstance.sharesOf(admin));
    const currentRatio = parseInt(await stakingInstance.getDtxPerShare());
    const stakedRatio =
      (parseInt(web3.utils.toWei('500')) * base) /
      parseInt(web3.utils.toWei('500'));

    const expectedReward = (shares * (currentRatio - stakedRatio)) / base;

    expect(parseInt(await stakingInstance.rewardOf(admin))).to.be.equal(
      expectedReward
    );
  });

  it('should get the total stakes', async () => {
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: admin,
      }
    );
    await stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
      from: admin,
    });

    expect((await stakingInstance.getTotalStakes()).toString()).to.be.equal(
      web3.utils.toWei('500')
    );
  });

  it('should refund DTX to the respective stakeholders', async () => {
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker1,
      }
    );
    await stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
      from: staker1,
    });

    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('1000'),
      {
        from: staker2,
      }
    );
    await stakingInstance.createStake(web3.utils.toWei('1000'), {
      from: staker2,
    });

    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: staker3,
      }
    );
    await stakingInstance.createStake(web3.utils.toWei('500'), {
      from: staker3,
    });

    await dtxInstance.transfer(
      stakingInstance.address,
      web3.utils.toWei('100'),
      {
        from: owner,
      }
    );

    expect((await dtxInstance.balanceOf(staker1)).toString()).to.be.equal(
      web3.utils.toWei('0')
    );
    expect((await dtxInstance.balanceOf(staker2)).toString()).to.be.equal(
      web3.utils.toWei('0')
    );
    expect((await dtxInstance.balanceOf(staker3)).toString()).to.be.equal(
      web3.utils.toWei('0')
    );

    await stakingInstance.refundLockedDTX(0, 2, {
      from: admin,
    });

    expect((await dtxInstance.balanceOf(staker1)).toString()).to.be.equal(
      web3.utils.toWei('500')
    );
    expect((await dtxInstance.balanceOf(staker2)).toString()).to.be.equal(
      web3.utils.toWei('1000')
    );
    expect((await dtxInstance.balanceOf(staker3)).toString()).to.be.equal(
      web3.utils.toWei('0')
    );

    await stakingInstance.refundLockedDTX(2, 3, {
      from: admin,
    });

    expect((await dtxInstance.balanceOf(staker1)).toString()).to.be.equal(
      web3.utils.toWei('600')
    );
    expect((await dtxInstance.balanceOf(staker2)).toString()).to.be.equal(
      web3.utils.toWei('1000')
    );
    expect((await dtxInstance.balanceOf(staker3)).toString()).to.be.equal(
      web3.utils.toWei('500')
    );
  });
  // TODO: Scenario3 - 1wei DTX reward added to the program
  // it.only('scenario3', async () => {});

  it('should be able to call setInitialRatio once', async () => {
    await dtxInstance.approve(
      stakingInstance.address,
      web3.utils.toWei('500'),
      {
        from: admin,
      }
    );
    await stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
      from: admin,
    });

    await expectRevert(
      stakingInstance.setInitialRatio(web3.utils.toWei('500'), {
        from: admin,
      }),
      'Initial Ratio has already been set -- Reason given: Initial Ratio has already been set.'
    );
  });
});
