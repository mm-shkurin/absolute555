# Brief Product Description

1. It is a used-car marketplace — private sellers list a car, buyers browse, filter and
   negotiate the price on the platform. Regional focus (Omsk), web plus an Android wrapper.

2. The user does one of two things. As a **seller**: photographs the vehicle registration
   certificate (СТС), the listing fills itself in from the OCR-decoded VIN, the seller adds
   price, mileage, photos and description, and sends it to moderation. As a **buyer**:
   filters the feed by brand, model, year, price and mileage, opens a listing, sends a price
   offer and talks to the seller in an on-platform chat.

3. The main goal is a trustworthy local marketplace where the listing is cheap to create
   (the СТС does the typing) and the counterparty is not anonymous — every seller carries a
   rating earned from closed deals, and every listing has passed a moderator.

4. The underlying logic is:
   - Sign in via Yandex ID or VK ID; browsing the feed works for a guest without signing in.
   - Seller uploads СТС photos; a background task OCRs them, decodes the VIN and fills brand,
     model, year and specs into the listing draft.
   - Seller completes the draft (price, mileage, phone, photos, description) and submits it.
   - A moderator publishes or rejects with a reason; only published listings reach the feed.
   - Buyer filters the feed against the brand/model reference tables and opens a listing.
   - Buyer sends an offer with a price; seller accepts, rejects or lets it expire. Accepting
     an offer marks the listing sold and auto-rejects the remaining offers.
   - Either side opens a chat on the listing; the seller's phone stays hidden until they
     choose to reveal it.
   - After a deal closes the buyer rates the seller; the rating aggregates on the profile.

## Out of scope

The project began as a car-service management system. The service side is deliberately
removed, not deferred: no appointments, no repair history, no maintenance records, no
ML prediction of part replacement, and no spare-parts catalogue. The `service_owner` and
`owner` roles go with it. What remains of the original ML work is the СТС/VIN decoding,
which serves listing autofill.
