// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  MembershipPassNFT,
} from "../typechain";

describe("Withdraw", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let dynamicSketch: DropCreator;

  let minterContract: MembershipPassNFT;
  let minterContractAddress: string;

  beforeEach(async () => {
    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "MembershipPassNFT",
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await artist.getAddress();

    await dynamicSketch.createDrop(
      "Testing Token",
      "TEST", "http://example.com/token/", 10);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "MembershipPassNFT",
      dropResult
    )) as MembershipPassNFT;
    minterContractAddress = await minterContract.address;

    const mintCost = ethers.utils.parseEther("0.1");
    await minterContract.setPricing(10, 500, mintCost, mintCost, 10);
  });

  it("Only the owner can withdraw from the contract", async () => {
    await expect(minterContract.connect(artist).withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Try to withdraw with no balance", async () => {
    const contractStartBalance = await ethers.provider.getBalance(minterContractAddress);
    const ownerStartBalance = await ethers.provider.getBalance(signerAddress);

    await expect(minterContract.withdraw());

    const contractEndBalance = await ethers.provider.getBalance(minterContractAddress);
    const ownerEndBalance = await ethers.provider.getBalance(signerAddress);

    expect(contractStartBalance).to.be.equal(contractEndBalance);
    expect(ownerStartBalance).to.be.gt(ownerEndBalance);    
  });

  it("Try to withdraw with ETH balance", async () => {
    await minterContract.setAllowedMinter(2);

    const mintCost = ethers.utils.parseEther("0.1");
    expect(await minterContract.purchase({ value: mintCost })).to.emit(minterContract, "EditionSold");

    const contractStartBalance = await ethers.provider.getBalance(minterContractAddress);
    const ownerStartBalance = await ethers.provider.getBalance(signerAddress);

    await expect(minterContract.withdraw());

    const contractEndBalance = await ethers.provider.getBalance(minterContractAddress);
    const ownerEndBalance = await ethers.provider.getBalance(signerAddress);

    expect(contractStartBalance).to.be.equal(contractEndBalance);
    expect(ownerStartBalance).to.be.lt(ownerEndBalance);      
  });  
});
