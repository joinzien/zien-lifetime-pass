import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT,
  TestCash,
} from "../typechain";

describe("Redeem", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;   
  
  let user: SignerWithAddress;
  let userAddress: string;   

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

    const dynamicMintableAddressERC20 = (
        await deployments.get("TestCash")
      ).address;

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await artist.getAddress();
    
    user = (await ethers.getSigners())[2];
    userAddress = await user.getAddress();     
  });

  it("purchases a edition", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      10,         
      ["This is a testing token for all","This is a testing token for all","This is a testing token for all","This is a testing token for all","This is a testing token for all",
      "This is a testing token for all","This is a testing token for all","This is a testing token for all","This is a testing token for all","This is a testing token for all"],
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

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;

    const paymentTokenContract = (await ethers.getContractAt(
        "TestCash",
        dropResult
      )) as TestCash;

    await minterContract.setPricing(10, 500, 10, 10, 10, 1, 1, 1);

    expect(
      await minterContract.setSalePrice(ethers.utils.parseEther("0.2"))
    ).to.emit(minterContract, "PriceChanged");
    expect(
      await minterContract
        .connect(user)
        .purchase({ value: ethers.utils.parseEther("0.2") })
    ).to.emit(minterContract, "EditionSold");

    expect(await minterContract.totalSupply()).to.be.equal(1);

    await expect(minterContract.setOfferTerms(1, 2)).to.be.revertedWith("Wrong state");
    await expect(minterContract.rejectOfferTerms(1)).to.be.revertedWith("Not approved");
    await expect(minterContract.acceptOfferTerms(1)).to.be.revertedWith("Not approved");
    await expect(minterContract.connect(user).setOfferTerms(1, 2)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(minterContract.connect(user).rejectOfferTerms(1)).to.be.revertedWith("You currently can not redeem");
    await expect(minterContract.connect(user).acceptOfferTerms(1)).to.be.revertedWith("You currently can not redeem");

    await expect(minterContract.redeem(1)).to.be.revertedWith("Not approved");

    await minterContract.connect(user).redeem(1);    
    await minterContract.connect(user).abortRedemption(1);       
    await minterContract.connect(user).redeem(1);  
    
    await expect(minterContract.connect(user).redeem(1)).to.be.revertedWith("You currently can not redeem'");  

    await expect(minterContract.rejectOfferTerms(1)).to.be.revertedWith("Not approved");
    await expect(minterContract.acceptOfferTerms(1)).to.be.revertedWith("Not approved");
    await expect(minterContract.connect(user).setOfferTerms(1, 2)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(minterContract.connect(user).rejectOfferTerms(1)).to.be.revertedWith("You currently can not redeem");
    await expect(minterContract.connect(user).acceptOfferTerms(1)).to.be.revertedWith("You currently can not redeem"); 
    
    const USDC1000 = 1000000000;
    await minterContract.setOfferTerms(1, USDC1000);    
  });
});