//
// scripts/newdrop.js
//
// npx hardhat run --network rinkeby ./scripts/newdrop-price.js
//

async function main() {
    // Set up an ethers contract, representing our deployed Box instance
    const address = '0x18F1912Ab9C123323C35C7758F8DA7407695242e';
    const expandedNFTContract = await ethers.getContractFactory('ExpandedNFT');
    const expandedNFT = await expandedNFTContract.attach(address);

    // Set price
    const fee = ethers.utils.parseEther("0.01");
    await expandedNFT.setPricing(10, 5000, fee, fee, fee, 3, 1, 10);

    // Anyone can mint
    await expandedNFT.setAllowedMinter(3);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });