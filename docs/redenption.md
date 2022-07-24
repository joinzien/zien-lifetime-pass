# Redemption

1. The collector call `redeem` on in the new drop contract.
    A. The collector can call `abortRedemption` to stop the process.
3. The platform calculates the final production costs and calls `setOfferTerms` to set the payment amount required.
4. The collector now has the final offer.
    A. The collector can call `rejectOfferTerms` to stop the process.
    B. The collector can call `acceptOfferTerms` to start the production process.
5. The platform calls `productionComplete` to mark the work has finsihed, adding the condtional report and redeemed version of the work.
6. Once the collector receives the work. they can call `acceptDelivery`. Marknig that edition as reddeemed and switching the showing the redeemed version.