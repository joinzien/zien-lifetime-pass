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

describe("Withdraw", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let dynamicSketch: DropCreator;

  let minterContract: ExpandedNFT;
  let minterContractAddress: string;

  let paymentToken: TestCash;

  const nullAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "ExpandedNFT",
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
      artistAddress, "Testing Token",
      "TEST", "http://example.com/token/", 10, true);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;
    minterContractAddress = await minterContract.address;

    const mintCost = ethers.utils.parseEther("0.1");
    await minterContract.setPricing(10, 500, mintCost, mintCost, 10, 10);

    const { TestCash } = await deployments.fixture([
      "TestCash"
    ]);

    paymentToken = (await ethers.getContractAt(
      "TestCash",
      TestCash.address
    )) as TestCash;  

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

  it("Try to withdraw with ETH balance and artist", async () => {
    await minterContract.setAllowedMinter(2);

    const mintCost = ethers.utils.parseEther("0.1");
    expect(await minterContract.purchase({ value: mintCost })).to.emit(minterContract, "EditionSold");

    const contractStartBalance = await ethers.provider.getBalance(minterContractAddress);
    const ownerStartBalance = await ethers.provider.getBalance(signerAddress);
    const artistStartBalance = await ethers.provider.getBalance(artistAddress);

    const contractERC20StartBalance = await paymentToken.balanceOf(minterContractAddress);
    const ownerERC20StartBalance = await paymentToken.balanceOf(signerAddress);
    const artistERC20StartBalance = await paymentToken.balanceOf(artistAddress);

    await expect(minterContract.withdraw());

    const contractEndBalance = await ethers.provider.getBalance(minterContractAddress);
    const ownerEndBalance = await ethers.provider.getBalance(signerAddress);
    const artistEndBalance = await ethers.provider.getBalance(artistAddress);

    const contractERC20EndBalance = await paymentToken.balanceOf(minterContractAddress);
    const ownerERC20EndBalance = await paymentToken.balanceOf(signerAddress);
    const artistERC20EndBalance = await paymentToken.balanceOf(artistAddress);

    expect(contractStartBalance).to.be.equal(contractEndBalance);
    expect(ownerStartBalance).to.be.lt(ownerEndBalance);  
    expect(artistStartBalance).to.be.lt(artistEndBalance);        
    expect(contractERC20StartBalance).to.be.equal(contractERC20EndBalance);
    expect(ownerERC20StartBalance).to.be.equal(ownerERC20EndBalance);   
    expect(artistERC20StartBalance).to.be.equal(artistERC20EndBalance);    
  });  

  it("Try to withdraw with ETH balance with no artist", async () => {
    await minterContract.setAllowedMinter(2);
    await minterContract.setArtistWallet(nullAddress);

    const mintCost = ethers.utils.parseEther("0.1");
    expect(await minterContract.purchase({ value: mintCost })).to.emit(minterContract, "EditionSold");

    const contractStartBalance = await ethers.provider.getBalance(minterContractAddress);
    const ownerStartBalance = await ethers.provider.getBalance(signerAddress);
    const artistStartBalance = await ethers.provider.getBalance(artistAddress);

    const contractERC20StartBalance = await paymentToken.balanceOf(minterContractAddress);
    const ownerERC20StartBalance = await paymentToken.balanceOf(signerAddress);
    const artistERC20StartBalance = await paymentToken.balanceOf(artistAddress);

    await expect(minterContract.withdraw());

    const contractEndBalance = await ethers.provider.getBalance(minterContractAddress);
    const ownerEndBalance = await ethers.provider.getBalance(signerAddress);
    const artistEndBalance = await ethers.provider.getBalance(artistAddress);

    const contractERC20EndBalance = await paymentToken.balanceOf(minterContractAddress);
    const ownerERC20EndBalance = await paymentToken.balanceOf(signerAddress);
    const artistERC20EndBalance = await paymentToken.balanceOf(artistAddress);

    expect(contractStartBalance).to.be.equal(contractEndBalance);
    expect(ownerStartBalance).to.be.lt(ownerEndBalance);  
    expect(artistStartBalance).to.be.equal(artistEndBalance);        
    expect(contractERC20StartBalance).to.be.equal(contractERC20EndBalance);
    expect(ownerERC20StartBalance).to.be.equal(ownerERC20EndBalance);   
    expect(artistERC20StartBalance).to.be.equal(artistERC20EndBalance);    
  });  
});
