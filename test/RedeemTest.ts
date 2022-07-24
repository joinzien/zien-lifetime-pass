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
  const EditionCost = 1000000000;

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
      10,
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

    expect(await paymentToken.balanceOf(user.address)).to.be.equal("0x0000000000000000000000000000000000000000");

    await paymentToken.mint(user.address, EditionCost);
    expect(await paymentToken.balanceOf(user.address)).to.be.equal(EditionCost);

    await minterContract.setPaymentToken(paymentToken.address);
    expect(await minterContract.getPaymentToken()).to.be.equal(paymentToken.address);
  });

  it("Redeem an edition", async () => {
    await minterContract.connect(user).redeem(1);

    await minterContract.setOfferTerms(1, ethers.utils.parseEther("0.1"));

    await minterContract.connect(user).acceptOfferTerms(1, {
      value: ethers.utils.parseEther("0.1")
    })

    const description = "Redeemed version of the description";

    const animationUrl = "http://redeemed.com/animation.mp4";
    const animationHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const imageUrl = "";
    const imageHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    const conditionReportUrl = "http://condiitionreport.com/report.pdf";
    const conditionReportHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    await minterContract.productionComplete(1, description, animationUrl, animationHash, imageUrl, imageHash, conditionReportUrl, conditionReportHash);

    await minterContract.connect(user).acceptDelivery(1);
  });
});
