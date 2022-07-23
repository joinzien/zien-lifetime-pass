# Expanded NFTs

Based on the [Zora NFT Editions](https://github.com/ourzora/nft-editions) contracts.

## What are these contracts?

1. `ExpandedNFT`
   Each drop is a unique contract.
   This allows for easy royalty collection, clear ownership of the collection, and your own contract 🎉
2. `DropCreator`
   Gas-optimized factory contract allowing you to easily + for a low gas transaction create your own drop mintable contract.
3. `SharedNFTLogic`
   Contract that includes dynamic metadata generation for your editions removing the need for a centralized server.
   imageUrl and animationUrl can be base64-encoded data-uris for these contracts totally removing the need for IPFS

## How do I create and use Expanded NFTs?

- [How do I create a new drop?](./docs/create-a-drop.md)
- [How to develop locally?](./docs/develop.md)
- [How do I control who can mint?](./docs/permissioning.md)
- [How to I mint?](./docs/minting.md)

## Deployed

### Rinkeby

- SharedNFTLogic [0x355a9bd0D92c77241A713BcaaB429e31802a7F4f](https://rinkeby.etherscan.io/address/0x355a9bd0D92c77241A713BcaaB429e31802a7F4f)
- ExpandedNFT [0xCD2e1c5C7B0D29D701AbCeE25d5F3d0f07836cF0](https://rinkeby.etherscan.io/address/0xCD2e1c5C7B0D29D701AbCeE25d5F3d0f07836cF0)
- DropCreator [0x586FB3320328Cf74501594D5dd963254D306e3ED](https://rinkeby.etherscan.io/address/0x586FB3320328Cf74501594D5dd963254D306e3ED)
- TestCash [0xFfC79238FdCe6C95F785Da8F63e002eC0c55336c](https://rinkeby.etherscan.io/address/0xFfC79238FdCe6C95F785Da8F63e002eC0c55336c)
