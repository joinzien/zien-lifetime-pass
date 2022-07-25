//
// scripts/newdrop.js
//
// npx hardhat run --network rinkeby ./scripts/newdrop.js
//

async function main() {
    // Set up an ethers contract, representing our deployed Box instance
    const address = '0x4274A19b9B0e2e47cB30091856c8444EB1b0429F';
    const dropCreatorContract = await ethers.getContractFactory('DropCreator');
    const dropCreator = await dropCreatorContract.attach(address);

    const artistAddress = "0xaD1fcD83DE77518d3D1b769F22B0A169eD55A919";

    const result = await dropCreator.createDrop(
        artistAddress, "Testing Token", "TEST", 10);

    console.log("Tx hash: " + result.hash);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });