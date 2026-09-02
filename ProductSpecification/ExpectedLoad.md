# Expected Load

- Multi-tenant in the sense that every user is a peer: any signed-in user can be both
  seller and buyer. No organisations, no dealer accounts.
- Regional marketplace, not a national one. Planning target for the first year:
  low thousands of registered users, hundreds of active listings at a time,
  tens of new listings a day.
- Read-heavy: the feed and listing pages take the overwhelming majority of requests.
  Writes are rare and bursty (listing creation, offers, chat messages).
- The one expensive path is СТС OCR + VIN decode. It runs on ARQ, not in the request,
  and is bounded by how often a seller creates a listing — tens per day, not per second.
- Photo storage in MinIO/S3: assume up to 15 photos per listing at a few MB each.
- Chat is low-volume: a handful of messages per deal, delivered over SSE.
