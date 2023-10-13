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

describe("Transfer", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let user: SignerWithAddress;
  let userAddress: string;

  let dynamicSketch: DropCreator;
  let minterContract: MembershipPassNFT;

  beforeEach(async () => {
    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await signer.getAddress();

    user = (await ethers.getSigners())[2];
    userAddress = await user.getAddress();

    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "MembershipPassNFT",
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

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

    const mintCost = ethers.utils.parseEther("0.1");
    await minterContract.setPricing(10, 500, mintCost, mintCost, 2);
    await minterContract.setAllowedMinter(2);
  });

  it("Try to transfer not as the owner", async () => {
    await minterContract.mintEdition(await signer.getAddress(), {
      value: ethers.utils.parseEther("0.1")
    });
    expect(await minterContract.ownerOf(1)).to.equal(
      await signer.getAddress()
    );
    await expect(minterContract.connect(artist).transferFrom(signerAddress, userAddress, 1)).to.be.revertedWith("ERC721: caller is not token owner or approved");
  });

  it("Can not transfer the token", async () => {
    await minterContract.mintEdition(await signer.getAddress(), {
      value: ethers.utils.parseEther("0.1")
    });
    expect(await minterContract.ownerOf(1)).to.equal(
      await signer.getAddress()
    );

    await expect(minterContract.connect(signer).transferFrom(signerAddress, userAddress, 1)).to.be.revertedWith("This a Soulbound token. It cannot be transferred. It can only be burned by the token owner.");
  });

  it("Try to safe transfer not as the owner", async () => {
    await minterContract.mintEdition(await signer.getAddress(), {
      value: ethers.utils.parseEther("0.1")
    });
    expect(await minterContract.ownerOf(1)).to.equal(
      await signer.getAddress()
    );
    await expect(minterContract.connect(artist)["safeTransferFrom(address,address,uint256)"](signerAddress, userAddress, 1)).to.be.revertedWith("ERC721: caller is not token owner or approved");
  });

  it("Can not safe transfer the token", async () => {
    await minterContract.mintEdition(await signer.getAddress(), {
      value: ethers.utils.parseEther("0.1")
    });
    expect(await minterContract.ownerOf(1)).to.equal(
      await signer.getAddress()
    );

    await expect(minterContract.connect(signer)["safeTransferFrom(address,address,uint256)"](signerAddress, userAddress, 1)).to.be.revertedWith("This a Soulbound token. It cannot be transferred. It can only be burned by the token owner.");
  });

  it("Try to safe transfer with data not as the owner", async () => {
    await minterContract.mintEdition(await signer.getAddress(), {
      value: ethers.utils.parseEther("0.1")
    });
    expect(await minterContract.ownerOf(1)).to.equal(
      await signer.getAddress()
    );
    await expect(minterContract.connect(artist)["safeTransferFrom(address,address,uint256,bytes)"](signerAddress, userAddress, 1,"")).to.be.revertedWith("");
  });

  it("Can not safe transfer with data the token", async () => {
    await minterContract.mintEdition(await signer.getAddress(), {
      value: ethers.utils.parseEther("0.1")
    });
    expect(await minterContract.ownerOf(1)).to.equal(
      await signer.getAddress()
    );

    await expect(minterContract.connect(signer)["safeTransferFrom(address,address,uint256,bytes)"](signerAddress, userAddress, 1,"")).to.be.revertedWith("");
  });

});