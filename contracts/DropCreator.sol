// SPDX-License-Identifier: GPL-3.0

/**

    OpenEditions DropCreator
    
 */

pragma solidity ^0.8.19;

import {ClonesUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import {OpenEditionsNFT} from "./OpenEditionsNFT.sol";

contract DropCreator {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    /// Counter for current contract id upgraded
    CountersUpgradeable.Counter private _atContract;

    /// Address for implementation of OpenEditionsNFT to clone
    address public implementation;

    /// Initializes factory with address of implementation logic
    /// @param _implementation OpenEditionsNFT logic implementation contract to clone
    constructor(address _implementation) {
        implementation = _implementation;
    }

    /// Creates a new drop contract as a factory with a deterministic address
    /// Important: None of these fields (except the Url fields with the same hash) can be changed after calling
    /// @param _artistWallet User that created the drop
    /// @param _name Name of the drop contract
    /// @param _symbol Symbol of the drop contract
    /// @param _baseDir The base directory fo the metadata
    /// @param _dropSize The number of editions in the drop. Zero means unlimited
    /// @param differentEdtions Number of different editions that can be generated   
    /// @param randomMint should the minting be random or sequential
    function createDrop(
        address _artistWallet,
        string memory _name,
        string memory _symbol,
        string memory _baseDir,
        uint256 _dropSize,
        uint256 differentEdtions,
        bool randomMint        
    ) external returns (uint256) {
        address newContract = ClonesUpgradeable.cloneDeterministic(
            implementation,
            bytes32(abi.encodePacked(_atContract.current()))
        );

       OpenEditionsNFT(newContract).initialize(
            msg.sender,
            _artistWallet,
            _name,
            _symbol,
            _baseDir,
            _dropSize,
            differentEdtions,
            randomMint
        );

        uint256 newId = _atContract.current();        
        emit CreatedDrop(newId, msg.sender, _dropSize, newContract);
        // Returns the ID of the recently created minting contract
        // Also increments for the next contract creation call
        _atContract.increment();
        return newId;
    }

    /// Get drop given the created ID
    /// @param dropId id of drop to get contract for
    /// @return OpenEditionsNFT Drop NFT contract
    function getDropAtId(uint256 dropId)
        external
        view
        returns (OpenEditionsNFT)
    {
        return
            OpenEditionsNFT(
                ClonesUpgradeable.predictDeterministicAddress(
                    implementation,
                    bytes32(abi.encodePacked(dropId)),
                    address(this)
                )
            );
    }

    /// Emitted when a drop is created reserving the corresponding token IDs.
    /// @param dropId ID of newly created drop
    event CreatedDrop(
        uint256 indexed dropId,
        address indexed creator,
        uint256 dropSize,
        address dropContractAddress
    );
}
