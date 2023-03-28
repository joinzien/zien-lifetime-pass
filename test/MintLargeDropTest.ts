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

describe("Mint a large drop", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;    

  let user: SignerWithAddress;
  let userAddress: string; 

  let dynamicSketch: DropCreator;
  let minterContract: ExpandedNFT;

  beforeEach(async () => {
    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await artist.getAddress();   
    
    user = (await ethers.getSigners())[2];
    userAddress = await user.getAddress();

    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "ExpandedNFT",
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

    const dropSize = 2000;

    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      dropSize, true);

    const dropResult = await dynamicSketch.getDropAtId(0);   
    minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;
      
    for (let i=0; i < dropSize/10; i++) {
      await minterContract.loadMetadataChunk(
        1+ i*10, 10,
        ["http://example.com/token/01", "http://example.com/token/02", 
         "http://example.com/token/03", "http://example.com/token/04", 
         "http://example.com/token/05", "http://example.com/token/06", 
         "http://example.com/token/07", "http://example.com/token/08", 
         "http://example.com/token/09", "http://example.com/token/10"]
      );
    }

    const mintCost = ethers.utils.parseEther("0.1");
    await minterContract.setPricing(10, 500, mintCost, mintCost, dropSize, dropSize);   
  });


  it("Mint via mintMultipleEditions", async () => {
    await minterContract.setAllowedMinter(2);

    const dropSize = 2000;
    const mintSize = 20;
    
    for (let i=0; i < dropSize/mintSize; i++) {
      expect(await minterContract.mintMultipleEditions(signerAddress, mintSize, { value: ethers.utils.parseEther("2.0") })).to.emit(minterContract, "EditionSold");
    }
 
    expect(await minterContract.totalSupply()).to.be.equal(2000);
  });
});
