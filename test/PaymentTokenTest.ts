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

  it("Try to change pricing not as the owner", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10,
      true);

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;

    const { TestCash } = await deployments.fixture([
      "TestCash"
    ]);

    const paymentToken = (await ethers.getContractAt(
      "TestCash",
      TestCash.address
    )) as TestCash;    

    expect(await minterContract.getPaymentToken()).to.be.equal("0x0000000000000000000000000000000000000000");  

    await expect(minterContract.connect(artist).setPaymentToken(paymentToken.address)).to.be.revertedWith("Ownable: caller is not the owner");  
  });  

  it("update the purchase token", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10,
      true);

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;

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