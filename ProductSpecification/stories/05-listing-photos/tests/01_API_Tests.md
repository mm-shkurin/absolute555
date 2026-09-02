# API Tests — Фото объявления: загрузка, порядок, обложка

### 1. Seller adds a photograph to a listing
Tier: 1
```gherkin
Given a seller with a draft listing and an empty gallery
When the seller uploads one photograph
Then the gallery holds that one photograph
And it is the cover
And the answer carries a link to it and a link to its smaller copy
```

### 2. Photographs keep the order they were sent in
Tier: 1
```gherkin
Given a seller with a draft listing holding two photographs
When the seller uploads three more in one request
Then the gallery holds five photographs
And the three new ones follow the two that were already there, in the order sent
```

### 3. Seller rearranges the gallery and the cover follows
Tier: 1
```gherkin
Given a seller with a draft listing holding four photographs
When the seller sends the four in a different order, third one first
Then the gallery is in that order
And the photograph the seller put first is the cover
And the listing's preview is that photograph
```

### 4. An order that does not match what is stored is refused whole
Tier: 2
```gherkin
Given a seller with a draft listing holding three photographs
When the seller sends an order that omits one of them and names a photograph
  belonging to another listing
Then the request is refused
And the refusal names the omitted photograph and the unknown one
And the gallery is in its original order
```

### 5. Seller removes photographs and the order closes over the gaps
Tier: 1
```gherkin
Given a seller with a draft listing holding four photographs
When the seller removes the second one
Then the gallery holds three photographs
And they are in their original relative order with no gap
And the cover is unchanged
When the seller removes the first one
Then the photograph that was second is now the cover
```

### 7. A gallery holds no more than fifteen photographs
Tier: 1 (hz-06)
```gherkin
Given a seller with a draft listing holding fourteen photographs
When the seller uploads three more in one request
Then the upload is refused
And the refusal names fifteen as the limit, fourteen as held and three as offered
And the gallery still holds fourteen photographs
When the seller uploads one photograph
Then the gallery holds fifteen photographs
When the seller uploads one more
Then the upload is refused
```

### 8. A photograph larger than ten megabytes is refused
Tier: 1
```gherkin
Given a seller with a draft listing
When the seller uploads a photograph of eleven megabytes
Then the upload is refused as too large
And the gallery is empty
```

### 9. A file that is not an image is refused whatever it is called
Tier: 1 (hz-05)
```gherkin
Given a seller with a draft listing
When the seller uploads a file named photo.jpg whose content is not an image
Then the upload is refused
And the gallery is empty
```

### 10. A refused upload leaves nothing behind
Tier: 2 (hz-02)
```gherkin
Given a seller with a draft listing holding two photographs
When the seller uploads three photographs of which the last is not an image
Then the upload is refused
And the gallery still holds exactly the two it held before
And nothing from the refused request remains in storage
```

### 11. An upload with no files at all is refused
Tier: 2 (hz-05)
```gherkin
Given a seller with a draft listing
When the seller sends an upload carrying no files
Then the request is refused as invalid
```

### 12. A listing under review cannot gain or lose photographs
Tier: 1
```gherkin
Given a seller with a listing under review
When the seller uploads a photograph
Then the upload is refused because the listing is frozen
When the seller removes a photograph
Then the removal is refused because the listing is frozen
And the gallery is unchanged
```

### 13. A published listing can still be rearranged
Tier: 2
```gherkin
Given a seller with a published listing holding three photographs
When the seller sends them in a different order
Then the gallery is in that order
And the listing is still published
```

### 14. Three photographs are needed before a listing can be reviewed
Tier: 1
```gherkin
Given a seller with an otherwise complete draft holding two photographs
When the seller sends it for review
Then the listing is refused as incomplete
And the refusal names the photographs
When the seller adds a third photograph and sends it for review
Then the listing is under review
```

### 15. Every photograph is stored with a smaller copy beside it
Tier: 2
```gherkin
Given a seller with a draft listing
When the seller uploads a photograph of four megabytes
Then the answer carries a link to the original and a link to a smaller copy
And the smaller copy is smaller than the original
```

### 16. A listing carries its gallery in order
Tier: 2
```gherkin
Given a published listing holding three photographs in a known order
When anyone reads that listing
Then the photographs come back in that order
And the first one is the listing's preview
```

### 17. Two uploads arriving together cannot overfill the gallery
Tier: 2 (hz-03)
```gherkin
Given a seller with a draft listing holding fourteen photographs
When the seller uploads one photograph twice at the same moment
Then the gallery holds fifteen photographs
And one of the two uploads is refused
```

### 18. One request cannot carry more than the gallery could ever hold
Tier: 2 (hz-06)
```gherkin
Given a seller with a draft listing and an empty gallery
When the seller uploads a request whose files total more than the gallery may hold
Then the request is refused before any file is stored
```

