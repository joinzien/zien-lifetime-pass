// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT
} from "../typechain";

describe("Metadata", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let dynamicSketch: DropCreator;

  let minterContract: ExpandedNFT;

  beforeEach(async () => {
    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await artist.getAddress();

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


  });

  it("Load metadata, not as the owner", async () => {
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

    await expect(minterContract.connect(artist).loadMetadataChunk(
      1, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    )).to.be.revertedWith("Ownable: caller is not the owner");

    const metadataLoaded = await minterContract.metadataloaded();
    expect(metadataLoaded).to.be.equal(false);
  });

  it("Load metadata below the starting index", async () => {
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

    await expect(minterContract.loadMetadataChunk(
      0, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    )).to.be.revertedWith("StartIndex > 0");

    const metadataLoaded = await minterContract.metadataloaded();
    expect(metadataLoaded).to.be.equal(false);
  });

  it("Load metadata over the ending index", async () => {
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

    await expect(minterContract.loadMetadataChunk(
      2, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    )).to.be.revertedWith("Data large than drop size");

    const metadataLoaded = await minterContract.metadataloaded();
    expect(metadataLoaded).to.be.equal(false);
  });

  it("Load metadata", async () => {
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

    await minterContract.loadMetadataChunk(
      1, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    );

    const metadataLoaded = await minterContract.metadataloaded();
    expect(metadataLoaded).to.be.equal(true);
  });

  it("Load multiple metadata chunks", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      20, true);

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

    await minterContract.loadMetadataChunk(
      11, 10,
      ["http://example.com/token/11", "http://example.com/token/12",
        "http://example.com/token/13", "http://example.com/token/14",
        "http://example.com/token/15", "http://example.com/token/16",
        "http://example.com/token/17", "http://example.com/token/18",
        "http://example.com/token/19", "http://example.com/token/20"]
    );
  });

  it("Overlapping metadata chunks", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      20, true);

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

    await minterContract.loadMetadataChunk(
      5, 10,
      ["http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10",
        "http://example.com/token/11", "http://example.com/token/12",
        "http://example.com/token/13", "http://example.com/token/14"]
    );

    await minterContract.loadMetadataChunk(
      11, 10,
      ["http://example.com/token/11", "http://example.com/token/12",
        "http://example.com/token/13", "http://example.com/token/14",
        "http://example.com/token/15", "http://example.com/token/16",
        "http://example.com/token/17", "http://example.com/token/18",
        "http://example.com/token/19", "http://example.com/token/20"]
    );

    const metadataLoaded = await minterContract.metadataloaded();
    expect(metadataLoaded).to.be.equal(true);
  });

  it("Incomplete metadata loading", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      20, true);

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

    await minterContract.loadMetadataChunk(
      5, 10,
      ["http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10",
        "http://example.com/token/11", "http://example.com/token/12",
        "http://example.com/token/13", "http://example.com/token/14"]
    );

    const metadataLoaded = await minterContract.metadataloaded();
    expect(metadataLoaded).to.be.equal(false);

    const mintCost = ethers.utils.parseEther("0.1");
    await expect(minterContract.mintEditions([signerAddress], { value: mintCost })).to.be.revertedWith("Not all metadata loaded");
  });

  it("Try to load mismatched metadata", async () => {
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

    await expect(minterContract.loadMetadataChunk(
      1, 5,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    )).to.be.revertedWith("Data size mismatch");
  }); 

  it("Load redeemed metadata, not as the owner", async () => {
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

    await expect(minterContract.connect(artist).loadRedeemedMetadata(
      1, "https://example.com/redeemed/0001"
    )).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Load redeemed metadata below the starting index", async () => {
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

    await expect(minterContract.loadRedeemedMetadata(
      0, "https://example.com/redeemed/0001"
    )).to.be.revertedWith("tokenID > 0");
  });

  it("Load redeemed metadata over the ending index", async () => {
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

    await expect(minterContract.loadRedeemedMetadata(
      11, "https://example.com/redeemed/0001"
    )).to.be.revertedWith("tokenID <= drop size");
  });

  it("Load redeemed metadata", async () => {
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

    await minterContract.loadRedeemedMetadata(
      1, "https://example.com/redeemed/0001"
    );
  });

  it("Get the metadata for a unknown tokenID", async () => {
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

    await expect(minterContract.tokenURI(0)).to.be.revertedWith("No token");
  });  
});
