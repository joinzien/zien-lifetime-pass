// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  OpenEditionsNFT,
} from "../typechain";

describe("Mint randomly", () => {
    let signer: SignerWithAddress;
    let signerAddress: string;
  
    let artist: SignerWithAddress;
    let artistAddress: string;    
  
    let user: SignerWithAddress;
    let userAddress: string; 
  
    let dynamicSketch: DropCreator;
    let minterContract: OpenEditionsNFT;
  
    beforeEach(async () => {
      signer = (await ethers.getSigners())[0];
      signerAddress = await signer.getAddress();
  
      artist = (await ethers.getSigners())[1];
      artistAddress = await artist.getAddress();   
      
      user = (await ethers.getSigners())[2];
      userAddress = await user.getAddress();
  
      const { DropCreator } = await deployments.fixture([
        "DropCreator",
        "OpenEditionsNFT",
      ]);
  
      dynamicSketch = (await ethers.getContractAt(
        "DropCreator",
        DropCreator.address
      )) as DropCreator;
  
      await dynamicSketch.createDrop(
        artistAddress,
        "Testing Token",
        "TEST",
        "http://example.com/token/",
        10, 1, true);
  
      const dropResult = await dynamicSketch.getDropAtId(0);   
      minterContract = (await ethers.getContractAt(
        "OpenEditionsNFT",
        dropResult
      )) as OpenEditionsNFT;
  
      const mintCost = ethers.utils.parseEther("0.1");
      await minterContract.setPricing(10, 500, mintCost, mintCost, 2, 1);   
    });
  
    it("General user access control", async () => {
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
      expect(await minterContract.isRandomMint()).to.be.equal(true);
    }); 
    
    it("Change random mint status", async () => {
      expect(await minterContract.isRandomMint()).to.be.equal(true);

      await minterContract.setRandomMint(false);

      expect(await minterContract.isRandomMint()).to.be.equal(false);
    });  
    
    it("Change random mint status, not as the owner", async () => {
      expect(await minterContract.isRandomMint()).to.be.equal(true);

      await expect(minterContract.connect(user).setRandomMint(false)).to.be.revertedWith("Ownable: caller is not the owner"); 

      expect(await minterContract.isRandomMint()).to.be.equal(true);
    });    

});
