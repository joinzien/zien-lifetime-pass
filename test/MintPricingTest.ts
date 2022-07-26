import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";
import parseDataURI from "data-urls";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT,
} from "../typechain";

describe("Mint Pricing", () => { 
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
        10);

      const dropResult = await dynamicSketch.getDropAtId(0);
      minterContract = (await ethers.getContractAt(
        "ExpandedNFT",
        dropResult
      )) as ExpandedNFT;

      await minterContract.loadMetadataChunk(  
        0, 10,  
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
    });
   
    it("VIP users", async () => {
      let user = (await ethers.getSigners())[2];
      let userAddress = await user.getAddress();

      await minterContract.reserve ([userAddress], [1]) 

      const mintCost1 = ethers.utils.parseEther("0.1");  
      const mintCost2 = ethers.utils.parseEther("0.2");  
      const mintCost3 = ethers.utils.parseEther("0.4");                  
      await minterContract.setPricing(200, 500, mintCost1, mintCost2, mintCost3, 10, 10, 10);  

      await minterContract.setApprovedVIPMinters(1, [userAddress], [true]);

      await minterContract.setAllowedMinter(1);

      // Mint as a VIP
      await expect(minterContract.connect(user).mintEdition(userAddress, {
        value: ethers.utils.parseEther("0.1")
      }))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          1
        );

      await minterContract.setAllowedMinter(2);

      // Mint as a Member
      await expect(minterContract.connect(user).mintEdition(userAddress, {
        value: ethers.utils.parseEther("0.2")
      }))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          2
        );

      await minterContract.setAllowedMinter(3);

      // Mint as the general public
      await expect(minterContract.connect(user).mintEdition(userAddress, {
        value: ethers.utils.parseEther("0.4")
      }))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          3
        );  
        
        expect(await minterContract.totalSupply()).to.be.equal(3);
    }); 
  });
});
