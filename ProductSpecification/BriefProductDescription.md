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

5. A second supply channel runs alongside the in-stock feed: **import to order**. Suppliers
   who bring cars in from abroad apply through a form describing what they can source and how
   to reach them; the owner reviews the application and, on approval, grants the `importer`
   role. From then on the importer publishes on their own, the same way a seller does. The
   import tab shows three things: importer profiles (which countries, which makes, what terms),
   concrete cars offered for import with a price and a delivery window, and buyer requests --
   "bring me one of these" -- that importers answer.

   An import listing is the same `SaleCars` entity carrying a `listing_kind` flag, not a
   separate one, so filters, photos, offers and chat are shared. The flag is what makes VIN
   and СТС optional: a car that has not been imported yet has neither.

6. Under the listing sits a **paint-thickness map**: one universal car schematic (four
   projections — side, front, rear, top) with the body panels as clickable zones. Tapping a
   panel opens the photo the seller took of a thickness gauge held against it, with the
   reading on the gauge's screen. The reading is OCR'd from that screen rather than typed, so
   the seller cannot quietly enter a better number than the instrument showed — the same
   Tesseract that reads the СТС reads the gauge.

   The stored number colours the panel — factory paint, repainted, filler — which turns a
   folder of photos into a picture a buyer reads at a glance. Measuring is optional: a listing
   with every panel measured earns a badge and ranks higher, but a listing without one still
   publishes. That keeps the barrier to posting low while making the honest listing visibly
   better.

## Out of scope

The project began as a car-service management system. The service side is deliberately
removed, not deferred: no appointments, no repair history, no maintenance records, no
ML prediction of part replacement, and no spare-parts catalogue. The `service_owner` and
`owner` roles go with it. What remains of the original ML work is the СТС/VIN decoding,
which serves listing autofill.
