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

describe("Allow List", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;
  let dynamicSketch: DropCreator;
  let artist: SignerWithAddress;
  let artistAddress: string;
  let minterContract: ExpandedNFT;

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
      ["This is a testing token for all", "This is a testing token for all", "This is a testing token for all", "This is a testing token for all", "This is a testing token for all",
        "This is a testing token for all", "This is a testing token for all", "This is a testing token for all", "This is a testing token for all", "This is a testing token for all"],
      ["https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"],
      ["0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000"],
      ["", "", "", "", "", "", "", "", "", ""],
      ["0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000"]
    );

    await minterContract.setPricing(10, 500, 10, 10, 1, 1);

  });

  it("Add a wallet to the allow list", async () => {
    expect(await minterContract.name()).to.be.equal("Testing Token");
    expect(await minterContract.symbol()).to.be.equal("TEST");

    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);

    // Add a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [true])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(true);
  });

  it("Remove a wallet to the allow list", async () => {
    expect(await minterContract.name()).to.be.equal("Testing Token");
    expect(await minterContract.symbol()).to.be.equal("TEST");

    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);

    // Add a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [true])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(true);

    // Remove a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [false])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);
  });

});
