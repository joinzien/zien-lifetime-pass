// SPDX-License-Identifier: GPL-3.0

/**

    ExpandedNFTs

 */

pragma solidity ^0.8.15;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {IERC2981Upgradeable, IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import {SharedNFTLogic} from "./SharedNFTLogic.sol";
import {IExpandedNFT} from "./IExpandedNFT.sol";
/**
    This is a smart contract for handling dynamic contract minting.

    @dev This allows creators to mint a unique serial drop of an expanded NFT within a custom contract
    @author Zien
    Repository: https://github.com/joinzien/expanded-nft
*/
contract ExpandedNFT is
    ERC721Upgradeable,
    IExpandedNFT,
    IERC2981Upgradeable,
    OwnableUpgradeable
{
    enum WhoCanMint{ ONLY_OWNER, ALLOWLIST, ANYONE }

    enum ExpandedNFTStates{ UNMINTED, MINTED, REDEEM_STARTED, SET_OFFER_TERMS, ACCEPTED_OFFER, PRODUCTION_COMPLETE, REDEEMED }
    
    event PriceChanged(uint256 amount);
    event EditionSold(uint256 price, address owner);
    event WhoCanMintChanged(WhoCanMint minters);

    // State change events
    event RedeemStarted(uint256 tokenId, address owner);
    event RedeemAborted(uint256 tokenId, address owner);    
    event OfferTermsSet(uint256 tokenId);
    event OfferAccepted(uint256 tokenId);
    event OfferRejected(uint256 tokenId);
    event ProductionComplete(uint256 tokenId);
    event DeliveryAccepted(uint256 tokenId);

    struct PerToken { 
        // Hashmap of the Edition ID to the current 
        ExpandedNFTStates editionState;

        // Redemption price
        uint256 editionFee; 

        // Edition description
        string description;

        bool metadataLoaded;

        // Minted

        // animation_url field in the metadata
        string animationUrl;
        // Hash for the associated animation
        bytes32 animationHash;
        // Image in the metadata
        string imageUrl;
        // Hash for the associated image
        bytes32 imageHash;

        // Redeemed

        // animation_url field in the metadata
        string redeemedAnimationUrl;
        // Hash for the associated animation
        bytes32 redeemedAnimationHash;
        // Image in the metadata
        string redeemedImageUrl;
        // Hash for the associated image
        bytes32 redeemedImageHash;
        // Condition report in the metadata
        string conditionReportUrl;
        // Hash for the condition report
        bytes32 conditionReportHash;
    }

    struct Pricing { 
        // Royalty amount in bps
        uint256 royaltyBPS;

        // Split amount to the platforms. the artist in bps
        uint256 splitBPS;

        // Price for allow list sales
        uint256 allowListSalePrice;

        // Limit for allow list sales
        uint256 allowListMintLimit;

        // Price for general sales
        uint256 generalMintLimit;   

        // Allow list Addresses allowed to mint edition
        mapping(address => bool) allowListMinters;

        // Who can currently mint
        WhoCanMint whoCanMint;

        // Mint counts for each address
        mapping(address => uint256) mintCounts;                               
    }

    // metadata
    string public description;

    // Artists wallet address
    address private _artistWallet;

    // Per Token data
    mapping(uint256 => PerToken) private _perTokenMetadata;

    // Total size of the drop that can be minted
    uint256 public dropSize;

    uint256 private _loadedMetadata;

    // reservation list
    uint256 private _reserveCount;
    mapping(uint256 => address) private _reserveAddress;
    mapping(uint256 => uint256) private _reserveTokenId;

    mapping(uint256 => bool) private _tokenClaimed; 
    uint256 private _claimCount; 
    uint256 private _currentIndex;

    Pricing private _pricing;

    // Price for general sales
    uint256 public salePrice;

    // ERC20 interface for the payment token
    IERC20Upgradeable private _paymentTokenERC20;

    // NFT rendering logic contract
    SharedNFTLogic private immutable _sharedNFTLogic;

    // Global constructor for factory
    constructor(SharedNFTLogic sharedNFTLogic) {
        _sharedNFTLogic = sharedNFTLogic;
        _pricing.whoCanMint = WhoCanMint.ONLY_OWNER;

        _disableInitializers();
    }

    /**
      @param _owner wallet addres for the user that owns and can mint the drop, gets royalty and sales payouts and can update the base url if needed.
      @param artistWallet wallet address for thr User that created the drop
      @param _name Name of drop, used in the title as "$NAME NUMBER/TOTAL"
      @param _symbol Symbol of the new token contract
      @param _dropSize Number of editions that can be minted in total.    
      @dev Function to create a new drop. Can only be called by the allowed creator
           Sets the only allowed minter to the address that creates/owns the drop.
           This can be re-assigned or updated later
     */
    function initialize(
        address _owner,
        address artistWallet,
        string memory _name,
        string memory _symbol,
        uint256 _dropSize
    ) public initializer {
        require(_dropSize > 0, "Drop size must be > 0");

        __ERC721_init(_name, _symbol);
        __Ownable_init();

        // Set ownership to original sender of contract call
        transferOwnership(_owner);

        _artistWallet = artistWallet;
        dropSize = _dropSize;

        // Set edition id start to be 1 not 0
        _claimCount = 0; 
        _currentIndex = 1;

        // Set the metadata
        description = _name;
        _loadedMetadata = 0; 
    }

    /// @dev returns the number of minted tokens within the drop
    function totalSupply() public view returns (uint256) {
        return _claimCount;
    }

    /// @dev returns the royalty BPS
    function getRoyaltyBPS() public view returns (uint256) {
        return _pricing.royaltyBPS;
    }

    /// @dev returns the split BPS
    function getSplitBPS() public view returns (uint256) {
        return _pricing.splitBPS;
    }

    /// @dev returns the allow list sale price
    function getAllowListPrice() public view returns (uint256) {
        return _pricing.allowListSalePrice;
    }

    /// @dev returns the allow list mint limit
    function getAllowListMintLimit() public view returns (uint256) {
        return _pricing.allowListMintLimit;
    }

    /// @dev returns the general mint limit
    function getGeneralMintLimit() public view returns (uint256) {
        return _pricing.generalMintLimit;
    }

    /// @dev returns mint limit for the address
    function getMintLimit(address wallet) public view returns (uint256) {
        uint256 currentMintLimit = _currentMintLimit();

        if (_pricing.mintCounts[wallet]  >= currentMintLimit) {
            return 0;
        }
            
        return (currentMintLimit - _pricing.mintCounts[wallet]);   
    }

    /// @dev returns  if the address can mint
    function canMint(address wallet) public view returns (bool) {
        uint256 currentMintLimit = getMintLimit(wallet);   
        return (currentMintLimit > 0);   
    }


    /// @dev returns who can mint
    function getWhoCanMint() public view returns (uint256) {
        return uint256(_pricing.whoCanMint);
    }

    /// @dev returns if the address is on the allow list
    function allowListed(address wallet) public view returns (bool) {
        return _pricing.allowListMinters[wallet];
    }

    /**
      @dev returns the current ETH sales price
           based on who can currently mint.
     */
    function price() public view returns (uint256){
        if (_pricing.whoCanMint == WhoCanMint.ALLOWLIST) {
            return _pricing.allowListSalePrice;
        } else if (_pricing.whoCanMint == WhoCanMint.ANYONE) {
            return salePrice;
        } 
            
        return 0;       
    }

    /**
      @dev returns the current state of the provided token
     */
    function redeemedState(uint256 tokenId) public view returns (uint256) {
        require(tokenId > 0, "tokenID > 0");
        require(tokenId <= dropSize, "tokenID <= drop size");

        return uint256(_perTokenMetadata[tokenId].editionState);
    }

    /**
        Simple eth-based sales function
        More complex sales functions can be implemented through IExpandedNFT interface
     */

    /**
      @dev This allows the user to purchase an edition
           at the given price in the contract.
     */

    function purchase() external payable returns (uint256) {
        uint256 currentPrice = price();
        emit EditionSold(currentPrice, msg.sender);

        address[] memory toMint = new address[](1);
        toMint[0] = msg.sender;

        return _mintEditionsBody(toMint);  
    }

     /**
      @param to address to send the newly minted edition to
      @dev This mints one edition to the given address by an allowed minter on the edition instance.
     */
    function mintEdition(address to) external payable override returns (uint256) {
        address[] memory toMint = new address[](1);
        toMint[0] = to;

        return _mintEditionsBody(toMint);        
    }

    /**
      @param recipients list of addresses to send the newly minted editions to
      @dev This mints multiple editions to the given list of addresses.
     */
    function mintEditions(address[] memory recipients)
        external payable override returns (uint256)
    {
        return _mintEditionsBody(recipients);
    }   

    /**
      @param recipients list of addresses to send the newly minted editions to
      @dev This mints multiple editions to the given list of addresses.
     */
    function _mintEditionsBody(address[] memory recipients)
        internal returns (uint256)
    {
        require(_loadedMetadata >= dropSize, "Not all metadata loaded");

        require(_isAllowedToMint(), "Needs to be an allowed minter");

        uint256 currentPrice = price();
        require(currentPrice > 0, "Not for sale");
        require(msg.value == (currentPrice * recipients.length), "Wrong price");

        require((_pricing.mintCounts[msg.sender] + recipients.length - 1) < _currentMintLimit(), "Exceeded mint limit");

        require(_claimCount + recipients.length <= dropSize, "Over drop size");

        if (_pricing.whoCanMint == WhoCanMint.ALLOWLIST) {
            return _allowListMintEditions(recipients);
        }

        return _mintEditions(recipients);
    }  

    /**
      @dev Private function to mint without any access checks.
           Called by the public edition minting functions.
     */
    function _allowListMintEditions(address[] memory recipients)
        internal
        returns (uint256)
    {
        address currentMinter = msg.sender;

        uint256 unclaimed = 0;
        uint256 firstUnclaimed = _reserveCount;

        for (uint256 r = 0; r < _reserveCount; r++) {
            if (_reserveAddress[r] == currentMinter) {
                uint256 id = _reserveTokenId[r];

                if (_tokenClaimed[id] != true) {
                    if (r < firstUnclaimed) {
                       firstUnclaimed = r; 
                    }

                    unclaimed++;
                }
            }
        }

        require(unclaimed >= recipients.length, "Can not mint all editions");

        uint256 idToMint = 1;

        uint256 reservationCounter = firstUnclaimed;
        for (uint256 i = 0; i < recipients.length; i++) {
            while (_reserveAddress[reservationCounter] != currentMinter) {
                reservationCounter++;
            }  

            idToMint = _reserveTokenId[reservationCounter];

            _mint(recipients[i], idToMint);

            _perTokenMetadata[idToMint].editionState = ExpandedNFTStates.MINTED;
            _tokenClaimed[idToMint] = true;
            _pricing.mintCounts[currentMinter]++;
            _claimCount++;

            reservationCounter++;
        }

        return idToMint;            
    }    

    /**
      @dev Private function to mint without any access checks.
           Called by the public edition minting functions.
     */
    function _mintEditions(address[] memory recipients)
        internal
        returns (uint256)
    {
        address currentMinter = msg.sender;
       
        for (uint256 i = 0; i < recipients.length; i++) {
            while (_tokenClaimed[_currentIndex] == true) {
                _currentIndex++;
            }  

            _mint(recipients[i], _currentIndex);

            _perTokenMetadata[_currentIndex].editionState = ExpandedNFTStates.MINTED;
            _tokenClaimed[_currentIndex] = true;
            _pricing.mintCounts[currentMinter]++;
            _claimCount++;
        }

        return _currentIndex;        
    }    

    /**
      @param _royaltyBPS BPS of the royalty set on the contract. Can be 0 for no royalty.
      @param _splitBPS BPS of the royalty set on the contract. Can be 0 for no royalty. 
      @param _allowListSalePrice Sale price for allow listed wallets
      @param _generalSalePrice SalePrice for the general public     
      @param _allowListMintLimit Mint limit for allow listed wallets
      @param _generalMintLimit Mint limit for the general public                                                                                 
      @dev Set various pricing related values
     */
    function setPricing (
        uint256 _royaltyBPS,
        uint256 _splitBPS,
        uint256 _allowListSalePrice,  
        uint256 _generalSalePrice,
        uint256 _allowListMintLimit,
        uint256 _generalMintLimit             
    ) external onlyOwner {  
        _pricing.royaltyBPS = _royaltyBPS;
        _pricing.splitBPS = _splitBPS;

        _pricing.allowListSalePrice = _allowListSalePrice;
        salePrice = _generalSalePrice;

        _pricing.allowListMintLimit = _allowListMintLimit;
        _pricing.generalMintLimit = _generalMintLimit;

        emit PriceChanged(salePrice);
    }

    /**
      @param wallets A list of wallets
      @param tokenIDs A list of tokenId to reserve                                                                           
      @dev Reserve an edition for a wallet
     */
    function reserve (address[] calldata wallets, uint256[] calldata tokenIDs) 
        external onlyOwner {  
        for (uint256 i = 0; i < wallets.length; i++) {
            _reserveAddress[_reserveCount] = wallets[i]; 
            _reserveTokenId[_reserveCount] = tokenIDs[i];                
            _reserveCount++;
        }
    }

    /**
      @dev returns the current limit on edition that 
           can be minted by one wallet
     */
    function _currentMintLimit() internal view returns (uint256){
        if (_pricing.whoCanMint == WhoCanMint.ALLOWLIST) {
            return _pricing.allowListMintLimit;
        } else if (_pricing.whoCanMint == WhoCanMint.ANYONE) {
            return _pricing.generalMintLimit;
        } 
            
        return 0;       
    }

    /**
      @param _salePrice if sale price is 0 sale is stopped, otherwise that amount 
                       of ETH is needed to start the sale.
      @dev This sets a simple ETH sales price
           Setting a sales price allows users to mint the drop until it sells out.
           For more granular sales, use an external sales contract.
     */
    function setSalePrice(uint256 _salePrice) external onlyOwner {
        salePrice = _salePrice;

        _pricing.whoCanMint = WhoCanMint.ANYONE;

        emit WhoCanMintChanged(_pricing.whoCanMint);
        emit PriceChanged(_salePrice);
    }

    /**
      @param _salePrice if sale price is 0 sale is stopped, otherwise that amount 
                       of ETH is needed to start the sale.
      @dev This sets the allow list ETH sales price
           Setting a sales price allows users to mint the drop until it sells out.
           For more granular sales, use an external sales contract.
     */
    function setAllowListSalePrice(uint256 _salePrice) external onlyOwner {
        _pricing.allowListSalePrice = _salePrice;

        _pricing.whoCanMint = WhoCanMint.ALLOWLIST;

        emit WhoCanMintChanged(_pricing.whoCanMint);
        emit PriceChanged(_salePrice);
    }

     /**
      @param allowListSalePrice if sale price is 0 sale is stopped, otherwise that amount 
                       of ETH is needed to start the sale.
      @param generalSalePrice if sale price is 0 sale is stopped, otherwise that amount 
                       of ETH is needed to start the sale.                                              
      @dev This sets the members ETH sales price
           Setting a sales price allows users to mint the drop until it sells out.
           For more granular sales, use an external sales contract.
     */
    function setSalePrices(uint256 allowListSalePrice, uint256 generalSalePrice) external onlyOwner {
        _pricing.allowListSalePrice = allowListSalePrice;
        salePrice = generalSalePrice;        

        emit PriceChanged(generalSalePrice);
    }  

    /**
      @dev This withdraws ETH from the contract to the contract owner.
     */
    function withdraw() external onlyOwner {
        uint256 currentBalance = address(this).balance;
        if (currentBalance > 0) {
            uint256 platformFee = (currentBalance * _pricing.splitBPS) / 10000;
            uint256 artistFee = currentBalance - platformFee;

            AddressUpgradeable.sendValue(payable(owner()), platformFee);
            AddressUpgradeable.sendValue(payable(_artistWallet), artistFee);
        }

        if (address(_paymentTokenERC20) != address(0x0)) {
            uint256 currentBalanceERC20 = _paymentTokenERC20.balanceOf(address(this));
            if (currentBalanceERC20 > 0) {
                uint256 platformFee = (currentBalanceERC20 * _pricing.splitBPS) / 10000;
                uint256 artistFee = currentBalanceERC20 - platformFee;

                _paymentTokenERC20.transfer(owner(), platformFee);
                _paymentTokenERC20.transfer(_artistWallet, artistFee);
            }
        }
    }

    /**
      @dev This helper function checks if the msg.sender is allowed to mint the
            given edition id.
     */
    function _isAllowedToMint() internal view returns (bool) {
        if (_pricing.whoCanMint == WhoCanMint.ANYONE) {
            return true;
        }

        if (_pricing.whoCanMint == WhoCanMint.ALLOWLIST) {
            if (_pricing.allowListMinters[msg.sender]) {
                return true;
            }            
        }

        if (owner() == msg.sender) {
            return true;
        }

        return false;
    }

    /**
        Simple override for owner interface.
     */
    function owner()
        public
        view
        override(OwnableUpgradeable, IExpandedNFT)
        returns (address)
    {
        return super.owner();
    }

    /**
        return the artists wallet address
     */
    function getArtistWallet()
        public
        view
        returns (address)
    {
        return _artistWallet;
    }

     /**
        set the artists wallet address
     */
    function setArtistWallet(address wallet)
        public
        onlyOwner
    {
        _artistWallet = wallet;
    }   

    /**
        return the payment tokens address
     */
    function getPaymentToken()
        public
        view
        returns (address)
    {
        return address(_paymentTokenERC20);
    }

     /**
        set a new payment token address
     */
    function setPaymentToken(address paymentToken)
        public
        onlyOwner
    {
        if (address(_paymentTokenERC20) != address(0x0)) {
            require(_paymentTokenERC20.balanceOf(address(this)) == 0, "token must have 0 balance");
        }

        _paymentTokenERC20 = IERC20Upgradeable(paymentToken);
    }   

    /**
      @dev Sets the types of users who is allowed to mint.
     */
    function getAllowedMinter() public view returns (WhoCanMint){
        return _pricing.whoCanMint;
    }

    /**
      @param minters WhoCanMint enum of minter types
      @dev Sets the types of users who is allowed to mint.
     */
    function setAllowedMinter(WhoCanMint minters) public onlyOwner {
        require(((minters >= WhoCanMint.ONLY_OWNER) && (minters <= WhoCanMint.ANYONE)), "Needs to be a valid minter type");

        _pricing.whoCanMint = minters;
        emit WhoCanMintChanged(minters);
    }

    /**
      @param minter address to set approved minting status for
      @param allowed boolean if that address is allowed to mint
      @dev Sets the approved minting status of the given address.
           This requires that msg.sender is the owner of the given edition id.
           If the ZeroAddress (address(0x0)) is set as a minter,
             anyone will be allowed to mint.
           This setup is similar to setApprovalForAll in the ERC721 spec.
     */
    function setAllowListMinters(uint256 count, address[] calldata minter, bool[] calldata allowed) public onlyOwner {
        for (uint256 i = 0; i < count; i++) {
            _pricing.allowListMinters[minter[i]] = allowed[i];
        }
    }

    function metadataloaded() public view returns (bool){
        return (_loadedMetadata >= dropSize);
    }

    /**
      @param startIndex The first ID index to write the data
      @param count How many rows of data to load 
      @param _description Description of the edition, used in the description field of the NFT
      @param animationUrl Animation URL of the edition. Not required, but if omitted image URL needs to be included. This follows the opensea spec for NFTs
      @param animationHash The associated hash of the animation in sha-256 bytes32 format. If animation is omitted the hash can be zero.
      @param imageUrl Image URL of the the edition. Strongly encouraged to be used, if necessary, only animation URL can be used. One of animation and image url need to exist in a drop to render the NFT.
      @param imageHash SHA256 of the given image in bytes32 format (0xHASH). If no image is included, the hash can be zero.
      @dev Function to create a new drop. Can only be called by the allowed creator
           Sets the only allowed minter to the address that creates/owns the drop.
           This can be re-assigned or updated later
     */
    function loadMetadataChunk(
        uint256 startIndex,
        uint256 count,
        string[] memory _description,
        string[] memory animationUrl,
        bytes32[] memory animationHash,
        string[] memory imageUrl,
        bytes32[] memory imageHash

    ) public onlyOwner {
        require(startIndex > 0, "StartIndex > 0");
        require(startIndex + count <= dropSize + 1, "Data large than drop size");

        require(_description.length == count, "Data size mismatch");
        require(animationUrl.length == count, "Data size mismatch");
        require(animationHash.length == count, "Data size mismatch");
        require(imageUrl.length == count, "Data size mismatch");
        require(imageHash.length == count, "Data size mismatch");

        for (uint i = 0; i < count; i++) {
            uint index =  startIndex + i;
            
            _perTokenMetadata[index].description = _description[i];
            _perTokenMetadata[index].imageUrl = imageUrl[i];
            _perTokenMetadata[index].imageHash = imageHash[i];
            _perTokenMetadata[index].animationUrl = animationUrl[i];
            _perTokenMetadata[index].animationHash = animationHash[i];

            if (_perTokenMetadata[index].metadataLoaded != true) {
                _perTokenMetadata[index].metadataLoaded = true;
               _loadedMetadata++; 
            }
        }
    }

    /**
      @param tokenID The index to write the data
      @param animationUrl Animation URL of the edition. Not required, but if omitted image URL needs to be included. This follows the opensea spec for NFTs
      @param animationHash The associated hash of the animation in sha-256 bytes32 format. If animation is omitted the hash can be zero.
      @param imageUrl Image URL of the the edition. Strongly encouraged to be used, if necessary, only animation URL can be used. One of animation and image url need to exist in a drop to render the NFT.
      @param imageHash SHA256 of the given image in bytes32 format (0xHASH). If no image is included, the hash can be zero.
      @dev Function to create a new drop. Can only be called by the allowed creator
           Sets the only allowed minter to the address that creates/owns the drop.
           This can be re-assigned or updated later
     */
    function loadRedeemedMetadata(
        uint256 tokenID,
        string  memory animationUrl,
        bytes32 animationHash,
        string  memory imageUrl,
        bytes32 imageHash

    ) public onlyOwner {
        require(tokenID > 0, "tokenID > 0");
        require(tokenID <= dropSize, "tokenID <= drop size");
     

        _perTokenMetadata[tokenID].redeemedImageUrl = imageUrl;
        _perTokenMetadata[tokenID].redeemedImageHash = imageHash;
        _perTokenMetadata[tokenID].redeemedAnimationUrl = animationUrl;
        _perTokenMetadata[tokenID].redeemedAnimationHash = animationHash;
    }

    /**
      @dev Allows for updates of edition urls by the owner of the edition.
           Only URLs can be updated (data-uris are supported), hashes cannot be updated.
     */
    function updateRedeemedURLs(
        uint256 tokenId,
        string memory imageUrl,
        string memory animationUrl
    ) public onlyOwner {
        _perTokenMetadata[tokenId].redeemedImageUrl = imageUrl;
        _perTokenMetadata[tokenId].redeemedAnimationUrl = animationUrl;
    }

    /**
      @dev Allows for updates of edition urls by the owner of the edition.
           Only URLs can be updated (data-uris are supported), hashes cannot be updated.
     */
    function updateEditionURLs(
        uint256 tokenId,
        string memory imageUrl,
        string memory animationUrl
    ) public onlyOwner {
        _perTokenMetadata[tokenId].imageUrl = imageUrl;
        _perTokenMetadata[tokenId].animationUrl = animationUrl;
    }

    /// Returns the number of editions allowed to mint
    function numberCanMint() public view override returns (uint256) {
        return dropSize - _claimCount;
    }

    /**
        @param tokenId Token ID to burn
        User burn function for token id 
     */
    function burn(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved");
        _burn(tokenId);
    }

    function redeem(uint256 tokenId) public {
        require(_exists(tokenId), "No token");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved");

        require((_perTokenMetadata[tokenId].editionState == ExpandedNFTStates.MINTED), "You currently can not redeem");

        _perTokenMetadata[tokenId].editionState = ExpandedNFTStates.REDEEM_STARTED;
        emit RedeemStarted(tokenId, _msgSender());
    }

    function abortRedemption(uint256 tokenId) public {
        require(_exists(tokenId), "No token");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved");

        require((_perTokenMetadata[tokenId].editionState == ExpandedNFTStates.REDEEM_STARTED), "You currently can not redeem");

        _perTokenMetadata[tokenId].editionState = ExpandedNFTStates.MINTED;
        emit RedeemAborted(tokenId, _msgSender());
    }

    function setOfferTerms(uint256 tokenId, uint256 fee) public onlyOwner {
        require(_exists(tokenId), "No token");        
        require((_perTokenMetadata[tokenId].editionState == ExpandedNFTStates.REDEEM_STARTED), "Wrong state");

        _perTokenMetadata[tokenId].editionState = ExpandedNFTStates.SET_OFFER_TERMS;
        _perTokenMetadata[tokenId].editionFee = fee;

        emit OfferTermsSet(tokenId);
    }

    function rejectOfferTerms(uint256 tokenId) public {
        require(_exists(tokenId), "No token");        
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved");

        require((_perTokenMetadata[tokenId].editionState == ExpandedNFTStates.SET_OFFER_TERMS), "You currently can not redeem");

        _perTokenMetadata[tokenId].editionState = ExpandedNFTStates.MINTED;

        emit OfferRejected(tokenId);
    }

    function acceptOfferTerms(uint256 tokenId, uint256 paymentAmount) external {
        require(_exists(tokenId), "No token");        
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved");

        require((_perTokenMetadata[tokenId].editionState == ExpandedNFTStates.SET_OFFER_TERMS), "You currently can not redeem");

        require(paymentAmount >= _perTokenMetadata[tokenId].editionFee, "Wrong price");
        require(_paymentTokenERC20.allowance(_msgSender(), address(this)) >= _perTokenMetadata[tokenId].editionFee, "Insufficient allowance");

        bool success = _paymentTokenERC20.transferFrom(_msgSender(), address(this), _perTokenMetadata[tokenId].editionFee);
        require(success, "Could not transfer token");

        _perTokenMetadata[tokenId].editionState = ExpandedNFTStates.ACCEPTED_OFFER; 

        emit OfferAccepted(tokenId);
    }

    function productionComplete(
        uint256 tokenId,
        string memory _description,
        string memory animationUrl,
        bytes32 animationHash,
        string memory imageUrl,
        bytes32 imageHash, 
        string memory conditionReportUrl,
        bytes32 conditionReportHash               
    ) public onlyOwner {
        require(_exists(tokenId), "No token");        
        require((_perTokenMetadata[tokenId].editionState == ExpandedNFTStates.ACCEPTED_OFFER), "You currently can not redeem");

        // Set the NFT to display as redeemed
        _perTokenMetadata[tokenId].description = _description;
        _perTokenMetadata[tokenId].redeemedAnimationUrl = animationUrl;
        _perTokenMetadata[tokenId].redeemedAnimationHash = animationHash;
        _perTokenMetadata[tokenId].redeemedImageUrl = imageUrl;
        _perTokenMetadata[tokenId].redeemedImageHash = imageHash;
        _perTokenMetadata[tokenId].conditionReportUrl = conditionReportUrl;
        _perTokenMetadata[tokenId].conditionReportHash = conditionReportHash;

        _perTokenMetadata[tokenId].editionState = ExpandedNFTStates.PRODUCTION_COMPLETE;

        emit ProductionComplete(tokenId);
    }

    function acceptDelivery(uint256 tokenId) public {
        require(_exists(tokenId), "No token");        
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved");

        require((_perTokenMetadata[tokenId].editionState == ExpandedNFTStates.PRODUCTION_COMPLETE), "You currently can not redeem");

        _perTokenMetadata[tokenId].editionState = ExpandedNFTStates.REDEEMED;

        emit OfferRejected(tokenId);
    }

    /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function getDescription(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return _perTokenMetadata[tokenId].description;
    }

    /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function getImageUrl(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return _perTokenMetadata[tokenId].imageUrl;
    }

    /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function getImageHash(uint256 tokenId)
        public
        view
        returns (bytes32)
    {
        return _perTokenMetadata[tokenId].imageHash;
    }

     /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function getAnimationUrl(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return _perTokenMetadata[tokenId].animationUrl;
    }  

     /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function getAnimationHash(uint256 tokenId)
        public
        view
        returns (bytes32)
    {
        return _perTokenMetadata[tokenId].animationHash;
    }  

    /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function getRedeemedImageUrl(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return _perTokenMetadata[tokenId].redeemedImageUrl;
    }

    /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function getRedeemedImageHash(uint256 tokenId)
        public
        view
        returns (bytes32)
    {
        return _perTokenMetadata[tokenId].redeemedImageHash;
    }

     /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function getRedeemedAnimationUrl(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return _perTokenMetadata[tokenId].redeemedAnimationUrl;
    }   

     /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function getRedeemedAnimationHash(uint256 tokenId)
        public
        view
        returns (bytes32)
    {
        return _perTokenMetadata[tokenId].redeemedAnimationHash;
    }  

    /**
      @dev Get URIs for the condition report
      @return conditionReportUrl, conditionReportHash
     */
    function getConditionReportUrl(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return (_perTokenMetadata[tokenId].conditionReportUrl);
    }

    /**
      @dev Get URIs for the condition report
      @return conditionReportUrl, conditionReportHash
     */
    function getConditionReportHash(uint256 tokenId)
        public
        view
        returns (bytes32)
    {
        return (_perTokenMetadata[tokenId].conditionReportHash);
    }

    /**
        @dev Get royalty information for token
        @param _salePrice Sale price for the token
     */
    function royaltyInfo(uint256, uint256 _salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        if (owner() == address(0x0)) {
            return (owner(), 0);
        }
        return (owner(), (_salePrice * _pricing.royaltyBPS) / 10_000);
    }

    /**
      @dev Get URIs for edition NFT
      @return _imageUrl, _imageHash, _animationUrl, _animationHash
     */
    function getURIs(uint256 tokenId)
        public
        view
        returns (
            string memory,
            bytes32,
            string memory,
            bytes32
        )
    {
        if (_perTokenMetadata[tokenId].editionState == ExpandedNFTStates.REDEEMED) {        
           return (_perTokenMetadata[tokenId].redeemedImageUrl, _perTokenMetadata[tokenId].redeemedImageHash,
                _perTokenMetadata[tokenId].redeemedAnimationUrl, _perTokenMetadata[tokenId].redeemedAnimationHash);
        }

        return (_perTokenMetadata[tokenId].imageUrl, _perTokenMetadata[tokenId].imageHash,
             _perTokenMetadata[tokenId].animationUrl, _perTokenMetadata[tokenId].animationHash);
    }

    /**
        @dev Get URI for given token id
        @param tokenId token id to get uri for
        @return base64-encoded json metadata object
    */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "No token");

        if (_perTokenMetadata[tokenId].editionState == ExpandedNFTStates.REDEEMED) {
            return
                _sharedNFTLogic.createMetadataEdition(
                    name(),
                    _perTokenMetadata[tokenId].description,
                    _perTokenMetadata[tokenId].redeemedImageUrl,
                    _perTokenMetadata[tokenId].redeemedAnimationUrl,
                    tokenId,
                    dropSize
                );
        }

        return
            _sharedNFTLogic.createMetadataEdition(
                name(),
                _perTokenMetadata[tokenId].description,
                _perTokenMetadata[tokenId].imageUrl,
                _perTokenMetadata[tokenId].animationUrl,
                tokenId,
                dropSize
            );
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, IERC165Upgradeable)
        returns (bool)
    {
        return
            type(IERC2981Upgradeable).interfaceId == interfaceId ||
            ERC721Upgradeable.supportsInterface(interfaceId);
    }
}
