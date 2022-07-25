//
// scripts/newdrop.js
//
// npx hardhat run --network rinkeby ./scripts/newdrop-metadata.js
//

async function main() {
    // Set up an ethers contract, representing our deployed Box instance
    const address = '0x18F1912Ab9C123323C35C7758F8DA7407695242e';
    const expandedNFTContract = await ethers.getContractFactory('ExpandedNFT');
    const expandedNFT = await expandedNFTContract.attach(address);

    const result = await expandedNFT.loadMetadataChunk(
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

    console.log("Tx hash: " + result.hash);

    const fee = ethers.utils.parseEther("0.01");
    await expandedNFT.setPricing(10, 5000, fee, fee, fee, 3, 1, 10);

    // anyone can mint
    await expandedNFT.setAllowedMinter(3);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });