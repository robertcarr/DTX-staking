/**
 * Copyright (C) SettleMint NV - All Rights Reserved
 *
 * Use of this file is strictly prohibited without an active license agreement.
 * Distribution of this file, via any medium, is strictly prohibited.
 *
 * For license inquiries, contact hello@settlemint.com
 *
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.7.0;
pragma experimental ABIEncoderV2;

import { OVM_L1CrossDomainMessenger } from "@eth-optimism/contracts/OVM/bridge/messaging/OVM_L1CrossDomainMessenger.sol";

// And pretend this is on L1
contract Bank is OVM_L1CrossDomainMessenger {
    
    address public ovmL1CrossDomainMessenger;
    
    constructor(
        address _ovmL1CrossDomainMessenger
    ) {
        ovmL1CrossDomainMessenger = _ovmL1CrossDomainMessenger;
    }
    
    function balanceL2(address myOptimisticContractAddress) public {
        uint256 balance;
        sendMessage(
            myOptimisticContractAddress,
            abi.encodeWithSignature(
                "balanceOf(0xdE7A129B7Bb4B412aD4BF9d3D37dbff7E6AfF0B4)"
            ),
            1000000
        );
    }
}