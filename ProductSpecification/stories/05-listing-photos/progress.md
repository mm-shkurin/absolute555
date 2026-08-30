# 05 — Фото объявления: загрузка, порядок, обложка

## Spec

- [x] interview
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 seller adds a photograph to a listing
- [x] api-02 photographs keep the order they were sent in
- [x] api-03 seller rearranges the gallery and the cover follows
- [x] api-05 seller removes photographs and the order closes over the gaps
- [x] api-07 a gallery holds no more than fifteen photographs
- [x] api-08 a photograph larger than ten megabytes is refused
- [x] api-09 a file that is not an image is refused whatever it is called
- [x] api-12 a listing under review cannot gain or lose photographs
- [x] api-14 three photographs are needed before a listing can be reviewed

## Tier 1 — Security

- [x] sec-01 a stranger cannot touch someone elses gallery

- [x] harvest

## Tier 2 — Backend

- [x] api-04 an order that does not match what is stored is refused whole
- [x] api-06 removing the cover promotes the next photograph
- [x] api-10 a refused upload leaves nothing behind
- [x] api-11 an upload with no files at all is refused
- [x] api-13 a published listing can still be rearranged
- [x] api-15 every photograph is stored with a smaller copy beside it
- [x] api-16 a listing carries its gallery in order
- [x] api-17 two uploads arriving together cannot overfill the gallery
- [x] api-18 one request cannot carry more than the gallery could ever hold

## Tier 2 — Security

- [x] sec-02 photograph upload requires a signed-in caller
- [x] sec-03 the registration document is not readable by a stranger
- [x] sec-05 a link to the document stops working when it expires
- [x] sec-06 the document is not readable without a signature

## Tier 2 — Integration

- [x] int-01 the registration document is stored apart from the gallery
- [x] int-02 the document is discarded once a moderator has decided

## Tier 2 — Infrastructure

- [x] inf-02 documents already in the database move to the closed store
