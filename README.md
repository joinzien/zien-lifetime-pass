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

- [How do I create a new drop?](./doc/create-a-drop.md)
- [How to develop locally?](./doc/develop.md)
- [How do I control who can mint?](./doc/permissioning.md)
- [How to mint?](./doc/minting.md)
- [How to redeem an edition?](./doc/redemption.md)
- [How to withdraw royalties?](./doc/withdraw.md)

## Deployed

### Mainnet

- DropCreator [0xe93103a0a9aa6a7e7605e8b1f2d6e6445fe2769f](https://etherscan.io/address/0xe93103a0a9aa6a7e7605e8b1f2d6e6445fe2769f)
- ExpandedNFT [0xcdd58aea1642494c7d9578912c34b0bfd88a73c9](https://etherscan.io/address/0xcdd58aea1642494c7d9578912c34b0bfd88a73c9)
- SharedNFTLogic [0x6883e3b3aea73cbeccbfa6a11c3a617c2f92c574](https://etherscan.io/address/0x6883e3b3aea73cbeccbfa6a11c3a617c2f92c574)

### Goerli

- DropCreator [0xeff21941a8964f7132a31b970c838fb30674cbde](https://goerli.etherscan.io/address/0xeff21941a8964f7132a31b970c838fb30674cbde)
- ExpandedNFT [0x8f31e6a4f322668d3764850aa27dbf65172f2543](https://goerli.etherscan.io/address/0x8f31e6a4f322668d3764850aa27dbf65172f2543)
- SharedNFTLogic [0xecd59f3933649cf892402428723086e79829d2d7](https://goerli.etherscan.io/address/0xecd59f3933649cf892402428723086e79829d2d7)
- TestCash [0x9e4e27b8d9643d2405c24328869641e310da310f](https://goerli.etherscan.io/address/0x9e4e27b8d9643d2405c24328869641e310da310f)
