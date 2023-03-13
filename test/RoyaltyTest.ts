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

describe("Royalty", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let signer1: SignerWithAddress;

  let dynamicSketch: DropCreator;
  let minterContract: ExpandedNFT;

  beforeEach(async () => {
    const { DropCreator, ExpandedNFT } = await deployments.fixture([
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
    artistAddress = await signer.getAddress();

    signer1 = (await ethers.getSigners())[1];

    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      10, true);

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

    await minterContract.setPricing(10, 500, mintCost, mintCost, 15, 15);
    await minterContract.setAllowedMinter(2);
  });

  it("Follows royalty payout for owner", async () => {
    await minterContract.mintEdition(signerAddress, {
      value: ethers.utils.parseEther("0.1")
    });

    // allows royalty payout info to be updated
    expect((await minterContract.royaltyInfo(1, 100))[0]).to.be.equal(
      signerAddress
    );

    await minterContract.transferOwnership(await signer1.getAddress());
    
    expect((await minterContract.royaltyInfo(1, 100))[0]).to.be.equal(
      await signer1.getAddress()
    );
    expect(await minterContract.totalSupply()).to.be.equal(1);
  });

  it("No owner is handled", async () => {
    await minterContract.mintEdition(signerAddress, {
      value: ethers.utils.parseEther("0.1")
    });

    // allows royalty payout info to be updated
    expect((await minterContract.royaltyInfo(1, 100))[0]).to.be.equal(
      signerAddress
    );

    await minterContract.renounceOwnership();

    const nullAddress = "0x0000000000000000000000000000000000000000";
    expect((await minterContract.royaltyInfo(1, 100))[0]).to.be.equal(nullAddress);
    expect(await minterContract.totalSupply()).to.be.equal(1);
  });

  it("Get royalty BPS", async () => {
    expect((await minterContract.getRoyaltyBPS())).to.be.equal(10);
  });  

  it("Get split BPS", async () => {
    expect((await minterContract.getSplitBPS())).to.be.equal(500);
  });    
});
