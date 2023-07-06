# Open Edition Expanded NFTs

Based on the [Zora NFT Editions](https://github.com/ourzora/nft-editions) contracts.

## What are these contracts?

1. `OpenEditionsNFT`
   Each drop is a unique contract.
   This allows for easy royalty collection, clear ownership of the collection, and your contract 🎉
2. `DropCreator`
   Gas-optimized factory contract allowing you to easily + for a low gas transaction create your drop mintable contract.
3. `SharedNFTLogic`
   Contract that includes dynamic metadata generation for your editions removing the need for a centralized server.
   imageUrl and animationUrl can be base64-encoded data-uris for these contracts removing the need for IPFS

## How do I create and use Expanded NFTs?

- [How do I create a new drop?](./doc/create-a-drop.md)
- [How to develop locally?](./doc/develop.md)
- [How do I control who can mint?](./doc/permissioning.md)
- [How to mint?](./doc/minting.md)
- [How to redeem an edition?](./doc/redemption.md)
- [How to withdraw royalties?](./doc/withdraw.md)

