# Redemption

1. The collector call `redeem` on in the new drop contract.
   A. The collector can call `abortRedemption` to stop the process.
2. The platform calculates the final production costs and calls `setOfferTerms` to set the payment amount required.
3. The collector now has the final offer.
   A. The collector can call `rejectOfferTerms` to stop the process.
   B. The collector can approve the drop contract for the full payment amount then call `acceptOfferTerms` to start the production process.
4. The platform calls `productionComplete` to mark the work has finished, adding the condition report and updated metadata.
5. Once the collector receives the work they can call `acceptDelivery`. Marking that edition as redeemed and switching to display the redeemed version.
