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

describe("Mint Limits", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;    

  let dynamicSketch: DropCreator;

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
    artistAddress = await signer.getAddress();    
  });

  it("General mint limit", async () => {
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

    await minterContract.setPricing(10, 500, 0, 0, 2, 1);

    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0); 
    
    expect(await minterContract.canMint(signerAddress)).to.be.equal(false);  

    await expect(minterContract.purchase()).to.be.revertedWith("Not for sale");
    
    expect(
      await minterContract.setSalePrice(ethers.utils.parseEther("0.2"))
    ).to.emit(minterContract, "PriceChanged");

    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(1);    

    expect(await minterContract.canMint(signerAddress)).to.be.equal(true);  
 
    expect(
      await minterContract
        .purchase({ value: ethers.utils.parseEther("0.2") })
    ).to.emit(minterContract, "EditionSold");
    await expect(minterContract.purchase({ value: ethers.utils.parseEther("0.2") })).to.be.revertedWith( "Exceeded mint limit");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);

    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0);  

    expect(await minterContract.canMint(signerAddress)).to.be.equal(false);  

  });
  
  it("Allow list mint limit", async () => {
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

    //await minterContract.setPricing(10, 500, 0, 0, 1, 2);
    //await minterContract.reserve ([signerAddress], [1]) 

    //expect(await minterContract.getAllowListMintLimit()).to.be.equal(1);
    //expect(await minterContract.getGeneralMintLimit()).to.be.equal(2);
    //expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0);    

    //expect(await minterContract.canMint(signerAddress)).to.be.equal(false);  

    //await expect(minterContract.purchase()).to.be.revertedWith("Not for sale");
    
    //expect(
    //  await minterContract.setAllowListSalePrice(ethers.utils.parseEther("0.2"))
    //).to.emit(minterContract, "PriceChanged");

    //expect(await minterContract.getAllowListMintLimit()).to.be.equal(1);
    //expect(await minterContract.getGeneralMintLimit()).to.be.equal(2);
    //expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(1);    

    //expect(await minterContract.canMint(signerAddress)).to.be.equal(true);  

    //expect(
    //  await minterContract
    //    .purchase({ value: ethers.utils.parseEther("0.2") })
    //).to.emit(minterContract, "EditionSold");

    //expect(await minterContract.getAllowListMintLimit()).to.be.equal(1);
    //expect(await minterContract.getGeneralMintLimit()).to.be.equal(2);
    //expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0);       

    //expect(await minterContract.canMint(signerAddress)).to.be.equal(false);  

    //await expect(minterContract.purchase({ value: ethers.utils.parseEther("0.2") })).to.be.revertedWith( "Exceeded mint limit");
    
    //expect(await minterContract.totalSupply()).to.be.equal(1);
  });  

  it("General user access control", async () => {
    let user = (await ethers.getSigners())[2];
    let userAddress = await user.getAddress();

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

    const mintCost = ethers.utils.parseEther("0.1");

    await minterContract.setPricing(10, 500, mintCost, mintCost, 2, 1);

    await minterContract.setAllowedMinter(0);

    // Mint as a contract owner
    await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");      

    await minterContract.setAllowedMinter(1);

    // Mint as a member of the allow list
    await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");   

    await minterContract.setAllowedMinter(2);

    // Mint as the general public
    await expect(minterContract.connect(user).mintEdition(userAddress, {
      value: ethers.utils.parseEther("0.1")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        userAddress,
        1
      );
      
    expect(await minterContract.totalSupply()).to.be.equal(1);
  });   
});
