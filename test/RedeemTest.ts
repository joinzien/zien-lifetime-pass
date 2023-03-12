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

enum ExpandedNFTState {
  UNMINTED, 
  RESERVED, 
  MINTED, 
  REDEEM_STARTED, 
  SET_OFFER_TERMS, 
  ACCEPTED_OFFER, 
  PRODUCTION_COMPLETE, 
  REDEEMED
}

describe("Redeem", () => {
  const editionCost = 1000000000;

  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let user: SignerWithAddress;
  let userAddress: string;

  let dynamicSketch: DropCreator;

  let minterContract: ExpandedNFT;

  let paymentToken: TestCash;

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

    const dynamicMintableAddressERC20 = (
      await deployments.get("TestCash")
    ).address;

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await artist.getAddress();

    user = (await ethers.getSigners())[2];
    userAddress = await user.getAddress();

    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      10);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;

    const { TestCash } = await deployments.fixture([
      "TestCash"
    ]);

    paymentToken = (await ethers.getContractAt(
      "TestCash",
      TestCash.address
    )) as TestCash;

    await minterContract.loadMetadataChunk(
      1, 10,
      ["http://example.com/token/01", "http://example.com/token/02", 
       "http://example.com/token/03", "http://example.com/token/04", 
       "http://example.com/token/05", "http://example.com/token/06", 
       "http://example.com/token/07", "http://example.com/token/08", 
       "http://example.com/token/09", "http://example.com/token/10"]
    );

    await minterContract.setPricing(10, 500, 10, 10, 1, 1);

    expect(
      await minterContract.setSalePrice(ethers.utils.parseEther("0.2"))
    ).to.emit(minterContract, "PriceChanged");

    expect(
      await minterContract
        .connect(user)
        .purchase({ value: ethers.utils.parseEther("0.2") })
    ).to.emit(minterContract, "EditionSold");

    expect(await minterContract.totalSupply()).to.be.equal(1);

    expect(await paymentToken.balanceOf(user.address)).to.be.equal("0x0000000000000000000000000000000000000000");

    await paymentToken.mint(user.address, editionCost);
    expect(await paymentToken.balanceOf(user.address)).to.be.equal(editionCost);

    await minterContract.setPaymentToken(paymentToken.address);
    expect(await minterContract.getPaymentToken()).to.be.equal(paymentToken.address);
  });

  it("Redeem an edition", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED);  

    await minterContract.connect(user).redeem(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    await minterContract.setOfferTerms(1, editionCost);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.SET_OFFER_TERMS); 

    await paymentToken.connect(user).approve(minterContract.address, 0);
    await paymentToken.connect(user).approve(minterContract.address, editionCost);

    await minterContract.connect(user).acceptOfferTerms(1, editionCost);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.ACCEPTED_OFFER); 

    const redeemedUrl = "http://example.com/redempted/token04/";
    await minterContract.productionComplete(1, redeemedUrl);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.PRODUCTION_COMPLETE); 

    await minterContract.connect(user).acceptDelivery(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEMED); 
  });

  it("Redeem an invalid edition, < 1", async () => {
    await expect(minterContract.connect(user).redeem(0)).to.be.revertedWith("No token"); 
  });

  it("Redeem an invalid edition, > drop size", async () => {
    await expect(minterContract.connect(user).redeem(11)).to.be.revertedWith("No token"); 
  });  

  it("Redeem not as the owner", async () => {
    await expect(minterContract.connect(artist).redeem(1)).to.be.revertedWith("Not approved"); 
  });

  it("Check the redeemed state an invalid edition. < 1", async () => {
    await expect(minterContract.connect(user).redeemedState(0)).to.be.revertedWith("tokenID > 0"); 
  });

  it("Check the redeemed state an invalid edition. > drop size", async () => {
    await expect(minterContract.connect(user).redeemedState(11)).to.be.revertedWith("tokenID <= drop size"); 
  });  

  it("Abort the redemption", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED); 

    await minterContract.connect(user).redeem(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    await minterContract.connect(user).abortRedemption(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED);    
  });

  it("Abort the redemption without a redemption started", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED); 

    await expect(minterContract.connect(user).abortRedemption(1)).to.be.revertedWith("You currently can not redeem"); 
  });

  it("Abort the redemption with an invalid ID", async () => {
    await expect(minterContract.connect(user).abortRedemption(2)).to.be.revertedWith("No token"); 
  });

  it("Abort the redemption, not as the owner", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED); 

    await minterContract.connect(user).redeem(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    await expect(minterContract.connect(artist).abortRedemption(1)).to.be.revertedWith("Not approved"); 
  });

  it("Set offer terms not as the owner", async () => {
    await expect(minterContract.connect(user).setOfferTerms(1,10)).to.be.reverted; 
  });  

  it("Set offer terms with an invalid ID", async () => {
    await expect(minterContract.setOfferTerms(2, 10)).to.be.revertedWith("No token"); 
  });

  it("Set offer terms with an invalid ID", async () => {
    await expect(minterContract.setOfferTerms(1, 10)).to.be.revertedWith("Wrong state"); 
  });

  it("Reject offer terms not as the owner", async () => {
    await expect(minterContract.connect(artist).rejectOfferTerms(2)).to.be.reverted; 
  });  

  it("Reject offer terms not as the owner", async () => {
    await expect(minterContract.connect(artist).rejectOfferTerms(1)).to.be.revertedWith("Not approved"); 
  }); 

  it("Reject offer terms in the incorrect state", async () => {
    await expect(minterContract.connect(user).rejectOfferTerms(1)).to.be.revertedWith("You currently can not redeem"); 
  });  

  it("Send wrong payment amount", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED); 

    await minterContract.connect(user).redeem(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    await minterContract.setOfferTerms(1, editionCost);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.SET_OFFER_TERMS); 

    await paymentToken.connect(user).approve(minterContract.address, 0);
    await paymentToken.connect(user).approve(minterContract.address, editionCost);

    await expect(minterContract.connect(user).acceptOfferTerms(1, 0)).to.be.revertedWith( "Wrong price");  

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.SET_OFFER_TERMS);    
  });

  it("Approve wrong payment amount", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED); 

    await minterContract.connect(user).redeem(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    await minterContract.setOfferTerms(1, editionCost);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.SET_OFFER_TERMS); 

    await paymentToken.connect(user).approve(minterContract.address, 0);
    await paymentToken.connect(user).approve(minterContract.address, editionCost/2);

    await expect(minterContract.connect(user).acceptOfferTerms(1, editionCost)).to.be.revertedWith( "Insufficient allowance");  

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.SET_OFFER_TERMS);     
  });

  it("Reject the offer terms", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED); 

    await minterContract.connect(user).redeem(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    await minterContract.setOfferTerms(1, editionCost);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.SET_OFFER_TERMS); 

    await minterContract.connect(user).rejectOfferTerms(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED);    
  });

  it("Redeem an edition more than once", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED); 

    await minterContract.connect(user).redeem(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    await minterContract.setOfferTerms(1, editionCost);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.SET_OFFER_TERMS); 

    await paymentToken.connect(user).approve(minterContract.address, 0);
    await paymentToken.connect(user).approve(minterContract.address, editionCost);

    await minterContract.connect(user).acceptOfferTerms(1, editionCost);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.ACCEPTED_OFFER); 

    const redeemedUrl = "http://example.com/redempted/token04/";
    await minterContract.productionComplete(1, redeemedUrl);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.PRODUCTION_COMPLETE); 

    await minterContract.connect(user).acceptDelivery(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEMED); 

    await expect(minterContract.connect(user).redeem(1)).to.be.revertedWith("You currently can not redeem");
  });  

  it("URLs and meta data should change when redeemed", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED); 

    await minterContract.connect(user).redeem(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    await minterContract.setOfferTerms(1, editionCost);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.SET_OFFER_TERMS); 

    await paymentToken.connect(user).approve(minterContract.address, 0);
    await paymentToken.connect(user).approve(minterContract.address, editionCost);

    await minterContract.connect(user).acceptOfferTerms(1, editionCost);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.ACCEPTED_OFFER); 

    const redeemedUrl = "http://example.com/redempted/token04/";
    await minterContract.productionComplete(1, redeemedUrl);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.PRODUCTION_COMPLETE); 

    const startTokenURI = await minterContract.connect(user).tokenURI(1);

    await minterContract.connect(user).acceptDelivery(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEMED); 

    const endTokenURI = await minterContract.connect(user).tokenURI(1);
    
    expect(startTokenURI).to.not.equal(endTokenURI);    
  });  

});
