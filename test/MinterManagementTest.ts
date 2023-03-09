// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT,
} from "../typechain";

describe("MinterManagement", () => { 
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;  

  let dynamicSketch: DropCreator;

  beforeEach(async () => {
    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "ExpandedNFT",
    ]);
    const dynamicMintableAddress = (
      await deployments.get("ExpandedNFT")
    ).address;
    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await signer.getAddress();

  });

  describe("with a drop", () => {
    let signer1: SignerWithAddress;
    let minterContract: ExpandedNFT;
    beforeEach(async () => {
      signer1 = (await ethers.getSigners())[1];
      await dynamicSketch.createDrop(
        artistAddress,
        "Testing Token",
        "TEST",
        10);

      const dropResult = await dynamicSketch.getDropAtId(0);
      minterContract = (await ethers.getContractAt(
        "ExpandedNFT",
        dropResult
      )) as ExpandedNFT;

      const mintCost = ethers.utils.parseEther("0.1");

      await minterContract.loadMetadataChunk(
        1, 10,
        ["http://example.com/token/01", "http://example.com/token/02", 
         "http://example.com/token/03", "http://example.com/token/04", 
         "http://example.com/token/05", "http://example.com/token/06", 
         "http://example.com/token/07", "http://example.com/token/08", 
         "http://example.com/token/09", "http://example.com/token/10"]
      );

      await minterContract.setPricing(10, 500, mintCost, mintCost, 20, 20);       
    });

    it("Contract owner user access control", async () => {
      await minterContract.reserve ([signerAddress], [1]) 

      await minterContract.setAllowedMinter(0);
      
      // Mint as a contract owner
      await expect(minterContract.mintEdition(signerAddress)).to.be.revertedWith("Not for sale");      
     
      minterContract.setAllowedMinter(1);

      // Mint as a member of the allow list
      //await expect(minterContract.mintEdition(signerAddress, {
      //  value: ethers.utils.parseEther("0.1")
      //}))
      //  .to.emit(minterContract, "Transfer")
      //  .withArgs(
      //    "0x0000000000000000000000000000000000000000",
      //    signerAddress,
      //    1
      //  );

      //await minterContract.setAllowedMinter(2);

      // Mint as the general public
      //await expect(minterContract.mintEdition(signerAddress, {
      //  value: ethers.utils.parseEther("0.1")
      //}))
      //  .to.emit(minterContract, "Transfer")
      //  .withArgs(
      //    "0x0000000000000000000000000000000000000000",
      //    signerAddress,
      //    2
      //  );
        
      //expect(await minterContract.totalSupply()).to.be.equal(2);
    }); 
    
    it("Allow list user access control", async () => {
      let user = (await ethers.getSigners())[2];
      let userAddress = await user.getAddress();
      await minterContract.reserve ([userAddress], [1])       

      await minterContract.setAllowListMinters(1, [userAddress], [true]);

      await minterContract.setAllowedMinter(0);

      // Mint as a contract owner
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");      

      await minterContract.setAllowedMinter(1);

      // Mint as a member of the allow list
      //await expect(minterContract.connect(user).mintEdition(userAddress, {
      //  value: ethers.utils.parseEther("0.1")
      //}))
      //  .to.emit(minterContract, "Transfer")
      //  .withArgs(
      //    "0x0000000000000000000000000000000000000000",
      //    userAddress,
      //    1
      //  );

      //await minterContract.setAllowedMinter(2);

      // Mint as the general public
      //await expect(minterContract.connect(user).mintEdition(userAddress, {
      //  value: ethers.utils.parseEther("0.1")
      //}))
      //  .to.emit(minterContract, "Transfer")
      //  .withArgs(
      //    "0x0000000000000000000000000000000000000000",
      //    userAddress,
      //    2
      //  );
        
      //expect(await minterContract.totalSupply()).to.be.equal(2);
    }); 
    
    it("General user access control", async () => {
      let user = (await ethers.getSigners())[2];
      let userAddress = await user.getAddress();
 
      await minterContract.setAllowedMinter(0);

      // Mint as a contract owner
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");      

      await minterContract.setAllowedMinter(1);

      // Mint as a member of the allow list
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");   

      await minterContract.setAllowedMinter(2);

      // Mint as the general public
      await expect(minterContract.connect(user).mintEdition(userAddress, {
        value: ethers.utils.parseEther("0.1")
      }))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          1
        );
        
      expect(await minterContract.totalSupply()).to.be.equal(1);
    });     
  });
});
