// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  MembershipPassNFT
} from "../typechain";

describe("Metadata", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;

  let dynamicSketch: DropCreator;

  let minterContract: MembershipPassNFT;

  beforeEach(async () => {
    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];

    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "MembershipPassNFT",
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;


  });

  it("Update the base directory", async () => {
    await dynamicSketch.createDrop(
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "MembershipPassNFT",
      dropResult
    )) as MembershipPassNFT;

    expect(await minterContract.baseDir()).to.be.equal("http://example.com/token/");

    await minterContract.updateBaseDir("http://example.com/edition/");

    expect(await minterContract.baseDir()).to.be.equal("http://example.com/edition/");
  });

  it("Try updating the base directory not as the owner", async () => {
    await dynamicSketch.createDrop(
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "MembershipPassNFT",
      dropResult
    )) as MembershipPassNFT;

    expect(await minterContract.baseDir()).to.be.equal("http://example.com/token/");

    await expect(minterContract.connect(artist).updateBaseDir("http://example.com/edition/")).to.be.revertedWith("Ownable: caller is not the owner");

    expect(await minterContract.baseDir()).to.be.equal("http://example.com/token/");
  });

  it("Get the metadata for a unknown tokenID", async () => {
    await dynamicSketch.createDrop(
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "MembershipPassNFT",
      dropResult
    )) as MembershipPassNFT;

    await expect(minterContract.tokenURI(0)).to.be.revertedWith("No token");
  });

  it("Check metadata values", async () => {
    await dynamicSketch.createDrop(
      "Testing Token",
      "TEST",
      "http://example.com/edition/1.json",
      10);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "MembershipPassNFT",
      dropResult
    )) as MembershipPassNFT;

    // Mint as the general public
    const mintCost = ethers.utils.parseEther("0.1");
    await minterContract.setPricing(10, 500, mintCost, mintCost, 10);   
    await minterContract.setAllowedMinter(2);

    await expect(minterContract.mintMultipleEditions(signerAddress, 10, {
      value: ethers.utils.parseEther("1.0")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        signerAddress,
        10
      );
      
    expect(await minterContract.totalSupply()).to.be.equal(10);
    expect(await minterContract.tokenURI(1)).to.be.equal("http://example.com/edition/1.json");   
    expect(await minterContract.tokenURI(2)).to.be.equal("http://example.com/edition/1.json");    
    expect(await minterContract.tokenURI(3)).to.be.equal("http://example.com/edition/1.json");    
    expect(await minterContract.tokenURI(4)).to.be.equal("http://example.com/edition/1.json");    
    expect(await minterContract.tokenURI(5)).to.be.equal("http://example.com/edition/1.json");  
    expect(await minterContract.tokenURI(6)).to.be.equal("http://example.com/edition/1.json");   
    expect(await minterContract.tokenURI(7)).to.be.equal("http://example.com/edition/1.json");    
    expect(await minterContract.tokenURI(8)).to.be.equal("http://example.com/edition/1.json");    
    expect(await minterContract.tokenURI(9)).to.be.equal("http://example.com/edition/1.json");    
    expect(await minterContract.tokenURI(10)).to.be.equal("http://example.com/edition/1.json");          
  });

});
