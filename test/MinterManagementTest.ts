import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";
import parseDataURI from "data-urls";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT,
} from "../typechain";

describe("MinterManagement", () => { 
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

  describe("with a drop", () => {
    let signer1: SignerWithAddress;
    let minterContract: ExpandedNFT;
    beforeEach(async () => {
      signer1 = (await ethers.getSigners())[1];
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
      minterContract = (await ethers.getContractAt(
        "ExpandedNFT",
        dropResult
      )) as ExpandedNFT;

      minterContract.setPricing(10, 500, 0, 0, 0, 20, 20, 20);       
    });

    it("Contract owner user access control", async () => {
      minterContract.setAllowedMinter(0);

      // Mint as a contract owner
      await expect(minterContract.mintEdition(signerAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          signerAddress,
          1
        );

      minterContract.setAllowedMinter(1);

      // Mint as a VIP
      await expect(minterContract.mintEdition(signerAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          signerAddress,
          2
        );

      minterContract.setAllowedMinter(2);

      // Mint as a Member
      await expect(minterContract.mintEdition(signerAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          signerAddress,
          3
        );

        minterContract.setAllowedMinter(3);

      // Mint as the general public
      await expect(minterContract.mintEdition(signerAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          signerAddress,
          4
        );        
    }); 
    
    it("VIP user access control", async () => {
      let user = (await ethers.getSigners())[2];
      let userAddress = await user.getAddress();

      minterContract.setApprovedVIPMinters(1, [userAddress], [true]);

      minterContract.setAllowedMinter(0);

      // Mint as a contract owner
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");      

      minterContract.setAllowedMinter(1);

      // Mint as a VIP
      await expect(minterContract.connect(user).mintEdition(userAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          1
        );

      minterContract.setAllowedMinter(2);

      // Mint as a Member
      await expect(minterContract.connect(user).mintEdition(userAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          2
        );

        minterContract.setAllowedMinter(3);

      // Mint as the general public
      await expect(minterContract.connect(user).mintEdition(userAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          3
        );        
    }); 
    
    it("Members user access control", async () => {
      let user = (await ethers.getSigners())[2];
      let userAddress = await user.getAddress();

      minterContract.setApprovedMinters(1, [userAddress], [true]);

      minterContract.setAllowedMinter(0);

      // Mint as a contract owner
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");      

      minterContract.setAllowedMinter(1);

      // Mint as a VIP
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");   

      minterContract.setAllowedMinter(2);

      // Mint as a Member
      await expect(minterContract.connect(user).mintEdition(userAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          1
        );

        minterContract.setAllowedMinter(3);

      // Mint as the general public
      await expect(minterContract.connect(user).mintEdition(userAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          2
        );        
    });  
    
    it("General user access control", async () => {
      let user = (await ethers.getSigners())[2];
      let userAddress = await user.getAddress();

      minterContract.setAllowedMinter(0);

      // Mint as a contract owner
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");      

      minterContract.setAllowedMinter(1);

      // Mint as a VIP
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");   

      minterContract.setAllowedMinter(2);

      // Mint as a Member
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");

      minterContract.setAllowedMinter(3);

      // Mint as the general public
      await expect(minterContract.connect(user).mintEdition(userAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          1
        );        
    });      
  });
});
