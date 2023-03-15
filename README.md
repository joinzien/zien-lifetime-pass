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

### Goerli

- DropCreator [0xCD4801c694Bc3754DcB2918574554d52B3D559ab](https://goerli.etherscan.io/address/0xCD4801c694Bc3754DcB2918574554d52B3D559ab)
- ExpandedNFT [0x78c13e0ED1191f67a63EEE24c4646011b1E14061](https://goerli.etherscan.io/address/0x78c13e0ED1191f67a63EEE24c4646011b1E14061)
- TestCash [0xA824EaC0F6962ce4dC31D6Cfc4BCC2732ABD45Fa](https://goerli.etherscan.io/address/0xA824EaC0F6962ce4dC31D6Cfc4BCC2732ABD45Faf)
