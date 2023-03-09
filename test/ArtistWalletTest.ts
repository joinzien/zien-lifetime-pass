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

describe("ArtistWallet", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;
  
  let artist: SignerWithAddress;
  let artistAddress: string;
  
  let newArtist: SignerWithAddress;
  let newArtistAddress: string;

  let dynamicSketch: DropCreator;
  let minterContract: ExpandedNFT;

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

    newArtist = (await ethers.getSigners())[2];
    newArtistAddress = await newArtist.getAddress();
    
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      10)

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

    minterContract.setPricing(10, 500, 10, 10, 1, 1);    
  });

  it("The artist wallet address is returned", async () => {
    expect(await minterContract.getArtistWallet()).to.be.equal(artistAddress);
  });

  it("Update the artist wallet", async () => {
    expect(await minterContract.getArtistWallet()).to.be.equal(artistAddress);

    minterContract.setArtistWallet(newArtistAddress);
    
    expect(await minterContract.getArtistWallet()).to.be.equal(newArtistAddress);
  });

  it("Only the owner can update the artist address", async () => {   
    await expect(minterContract.connect(newArtist).setArtistWallet(newArtistAddress)).to.be.revertedWith("Ownable: caller is not the owner");
  });  
});
