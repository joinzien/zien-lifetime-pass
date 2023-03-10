// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT,
  TestCash,
} from "../typechain";

describe("Payment Token", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;   

  let dynamicSketch: DropCreator;

  beforeEach(async () => {
    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "ExpandedNFT"
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await artist.getAddress(); 
  });

  it("update the purchase token", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      10);

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;
      
    await minterContract.loadMetadataChunk(
      1, 10,
      ["http://example.com/token/01", "http://example.com/token/02", 
       "http://example.com/token/03", "http://example.com/token/04", 
       "http://example.com/token/05", "http://example.com/token/06", 
       "http://example.com/token/07", "http://example.com/token/08", 
       "http://example.com/token/09", "http://example.com/token/10"]
    );

    const { TestCash } = await deployments.fixture([
      "TestCash"
    ]);

    const paymentToken = (await ethers.getContractAt(
      "TestCash",
      TestCash.address
    )) as TestCash;    

    expect(await minterContract.getPaymentToken()).to.be.equal("0x0000000000000000000000000000000000000000");  

    await minterContract.setPaymentToken(paymentToken.address);
    expect(await minterContract.getPaymentToken()).to.be.equal(paymentToken.address);

    await minterContract.setPaymentToken(paymentToken.address);

    const expandedNFTAddress = minterContract.address;
    await paymentToken.mint(expandedNFTAddress , 1024);
    
    await expect(minterContract.setPaymentToken(paymentToken.address)).to.be.revertedWith("token must have 0 balance");      

  });
});