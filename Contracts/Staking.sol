// SPDX-License-Identifier: MIT
/**
 * Copyright (C) SettleMint NV - All Rights Reserved
 *
 * Use of this file is strictly prohibited without an active license agreement.
 * Distribution of this file, via any medium, is strictly prohibited.
 *
 * For license inquiries, contact hello@settlemint.com
 */

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// https://docs.openzeppelin.com/contracts/4.x/api/proxy#transparent-vs-uups
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Staking is
  Initializable,
  UUPSUpgradeable,
  AccessControlUpgradeable,
  PausableUpgradeable
{
  using EnumerableSet for EnumerableSet.AddressSet;

  IERC20 private dtxToken;
  EnumerableSet.AddressSet private stakeholders;

  struct Stake {
    uint256 stakedDTX;
    uint256 shares;
  }

  bytes32 private ADMIN_ROLE;
  uint256 private base;
  uint256 private totalStakes;
  uint256 private totalShares;
  bool private initialRatioFlag;

  mapping(address => Stake) private stakeholderToStake;

  event StakeAdded(address indexed stakeholder, uint256 amount, uint256 shares);
  event StakeRemoved(
    address indexed stakeholder,
    uint256 amount,
    uint256 shares,
    uint256 reward
  );

  modifier hasAdminRole() {
    require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
    _;
  }
  modifier isInitialRatioSet() {
    require(!initialRatioFlag, "Initial Ratio has already been set");
    _;
  }

  function initialize(
    address admin1,
    address admin2,
    address _dtxToken
  ) public initializer {
    AccessControlUpgradeable.__AccessControl_init();
    PausableUpgradeable.__Pausable_init();

    ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Set up roles
    _setupRole(ADMIN_ROLE, admin1);
    _setupRole(ADMIN_ROLE, admin2);

    dtxToken = IERC20(_dtxToken);
    base = 10**18;
  }

  function _authorizeUpgrade(address) internal override hasAdminRole {}

  function pauseContract() public hasAdminRole {
    _pause();
  }

  function unPauseContract() public hasAdminRole {
    _unpause();
  }

  function setInitialRatio(uint256 stakeAmount)
    public
    isInitialRatioSet
    hasAdminRole
  {
    require(
      totalShares == 0 && dtxToken.balanceOf(address(this)) == 0,
      "Stakes and shares are non-zero"
    );

    stakeholders.add(msg.sender);
    stakeholderToStake[msg.sender] = Stake({
      stakedDTX: stakeAmount,
      shares: stakeAmount
    });
    totalStakes = stakeAmount;
    totalShares = stakeAmount;
    initialRatioFlag = true;

    require(
      dtxToken.transferFrom(msg.sender, address(this), stakeAmount),
      "DTX transfer failed"
    );

    emit StakeAdded(msg.sender, stakeAmount, stakeAmount);
  }

  function createStake(uint256 stakeAmount) public whenNotPaused {
    uint256 shares = (stakeAmount * totalShares) /
      dtxToken.balanceOf(address(this));

    require(
      dtxToken.transferFrom(msg.sender, address(this), stakeAmount),
      "DTX transfer failed"
    );

    stakeholders.add(msg.sender);
    stakeholderToStake[msg.sender].stakedDTX += stakeAmount;
    stakeholderToStake[msg.sender].shares += shares;
    totalStakes += stakeAmount;
    totalShares += shares;

    emit StakeAdded(msg.sender, stakeAmount, shares);
  }

  function removeStake(uint256 stakeAmount) public whenNotPaused {
    require(
      stakeholderToStake[msg.sender].stakedDTX >= stakeAmount,
      "Not enough staked!"
    );

    uint256 stakedRatio = (stakeholderToStake[msg.sender].stakedDTX * base) /
      stakeholderToStake[msg.sender].shares;

    uint256 currentRatio = (dtxToken.balanceOf(address(this)) * base) /
      totalShares;

    uint256 sharesToWithdraw = (stakeAmount *
      stakeholderToStake[msg.sender].shares) /
      stakeholderToStake[msg.sender].stakedDTX;

    uint256 rewards = (sharesToWithdraw * (currentRatio - stakedRatio)) / base;

    stakeholderToStake[msg.sender].shares -= sharesToWithdraw;
    stakeholderToStake[msg.sender].stakedDTX -= stakeAmount;
    totalStakes -= stakeAmount;
    totalShares -= sharesToWithdraw;

    require(
      dtxToken.transfer(msg.sender, stakeAmount + rewards),
      "DTX transfer failed"
    );

    if (stakeholderToStake[msg.sender].stakedDTX == 0) {
      stakeholders.remove(msg.sender);
    }

    emit StakeRemoved(msg.sender, stakeAmount, sharesToWithdraw, rewards);
  }

  function getDtxPerShare() public view returns (uint256) {
    return (dtxToken.balanceOf(address(this)) * base) / totalShares;
  }

  function stakeOf(address stakeholder) public view returns (uint256) {
    return stakeholderToStake[stakeholder].stakedDTX;
  }

  function sharesOf(address stakeholder) public view returns (uint256) {
    return stakeholderToStake[stakeholder].shares;
  }

  function rewardOf(address stakeholder) public view returns (uint256) {
    uint256 stakeholderShares = stakeholderToStake[stakeholder].shares;
    uint256 stakeholderStakes = stakeholderToStake[stakeholder].stakedDTX;

    return ((stakeholderShares * getDtxPerShare()) / base) - stakeholderStakes;
  }

  function getTotalStakes() public view returns (uint256) {
    return totalStakes;
  }

  function getCurrentRewards() public view returns (uint256) {
    return dtxToken.balanceOf(address(this)) - totalStakes;
  }

  function getTotalStakeholders() public view returns (uint256) {
    return stakeholders.length();
  }

  function refundLockedDTX(uint256 from, uint256 to) public hasAdminRole {
    require(to <= stakeholders.length(), "Invalid `to` param");
    uint256 s;

    for (s = from; s < to; s += 1) {
      dtxToken.transfer(
        stakeholders.at(s),
        stakeholderToStake[stakeholders.at(s)].stakedDTX
      );
      stakeholderToStake[stakeholders.at(s)].stakedDTX = 0;
    }

    // Return remaining DTX to owner (platform commission)
    if (s == stakeholders.length()) {
      uint256 balance = dtxToken.balanceOf(address(this));
      if (balance != 0) {
        require(dtxToken.transfer(msg.sender, balance), "DTX transfer failed");
      }
    }
  }
}
