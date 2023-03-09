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

describe("Free Mints", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;
  let dynamicSketch: DropCreator;
  let artist: SignerWithAddress;
  let artistAddress: string;
  let minterContract: ExpandedNFT;

  const nullAddress = "0x0000000000000000000000000000000000000000";

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
    artistAddress = await artist.getAddress();

    await dynamicSketch.createDrop(
      artistAddress, "Testing Token",
      "TEST", 10);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
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

    await minterContract.setPricing(10, 500, 10, 10, 1, 1);

  });

  it("Only the owner can set free mints", async () => {
    await expect(minterContract.connect(artist).setFreeMints(artistAddress, 1)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Set free mints", async () => {
    await minterContract.setFreeMints(artistAddress, 1);

    expect(await minterContract.numberOfFreeMints(artistAddress)).to.be.equal(1);
  });

  it("free mints can be updated", async () => {
    await minterContract.setFreeMints(artistAddress, 1);

    expect(await minterContract.numberOfFreeMints(artistAddress)).to.be.equal(1);

    await minterContract.setFreeMints(artistAddress, 7);

    expect(await minterContract.numberOfFreeMints(artistAddress)).to.be.equal(7);
  });

  it("free mints can be set to zero", async () => {
    await minterContract.setFreeMints(artistAddress, 1);

    expect(await minterContract.numberOfFreeMints(artistAddress)).to.be.equal(1);

    await minterContract.setFreeMints(artistAddress, 0);

    expect(await minterContract.numberOfFreeMints(artistAddress)).to.be.equal(0);
  });
});
