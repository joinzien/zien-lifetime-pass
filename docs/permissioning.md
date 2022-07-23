# permissioning

# Set mint limits and prices
1. Call `setPricing` in the new drop contract:
    - Royalty BPS: `uint256` BPS of the royalty set on the contract. Can be 0 for no royalty.
    - Split BPS: `uint256` BPS of the royalty set on the contract. Can be 0 for no royalty. 
    - VIP Sale Price: `uint256` Sale price for VIPs.
    - Members Sale Price: `uint256` SalePrice for Members.  
    - General Sale Price: `uint256` SalePrice for the general public.     
    - VIP Mint Limit: `uint256` Mint limit for VIPs.
    - Members Mint Limit: `uint256` Mint limit for Members.  
    - General Mint Limit: `uint256` Mint limit for the general public.     

# Reserve for VIPs
1. Call `reserve` in the new drop contract:
    - Wallets: `address` A list of addresses who wish to reserve.
    - Token IDs: `uint256` A list of token IDs to reserve.

# Control who can mint
1. Call `setApprovedVIPMinters` in the new drop contract.
2. Call `setApprovedMinters` in the new drop contract.
3. Call `setAllowedMinter` in the new drop contract.
