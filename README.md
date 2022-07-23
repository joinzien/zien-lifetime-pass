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
- ExpandedNFT [0xA728F9D464e1746EF44F5C1B84A479fb39B64609](https://rinkeby.etherscan.io/address/0xA728F9D464e1746EF44F5C1B84A479fb39B64609)
- DropCreator [0x687ddb0c77117223837Cf526c0Bac1EAF568EaC5](https://rinkeby.etherscan.io/address/0x687ddb0c77117223837Cf526c0Bac1EAF568EaC5)
