# API Tests — Автозаполнение из СТС: привязка к справочнику

### 1. A registration scan fills the draft it is attached to
Tier: 1
```gherkin
Given a seller with an empty draft listing
When the seller attaches a photograph of the registration document
Then the attachment is accepted before the reading finishes
And the recognition is reported as running
When the reading finishes on a document naming a make the catalogue knows
Then the draft carries the vehicle identification number, the year and the make
And the make is the catalogue entry, not the spelling on the document
And the spelling on the document is kept beside it
And the recognition is reported as done
```

### 2. An unreadable photograph leaves the draft standing
Tier: 1
```gherkin
Given a seller with an empty draft listing
When the seller attaches a photograph that cannot be read
Then the recognition is reported as unreadable
And the draft still exists and is still editable
And no field of the draft was filled
```

### 3. A readable photograph whose contents make no sense is reported apart
Tier: 1
```gherkin
Given a seller with an empty draft listing
When the seller attaches a readable photograph the reading cannot make sense of
Then the recognition is reported as undecoded, not as unreadable
And the draft still exists and is still editable
```

### 4. A make the catalogue does not know does not stop the sale
Tier: 1
```gherkin
Given a seller with a draft listing
When the reading returns a make no catalogue entry matches
Then the draft carries the spelling from the document and no catalogue make
And the spelling is queued for a moderator once
When the seller completes the remaining fields and sends the listing for review
Then the listing is accepted for review
```

### 5. What the seller chose survives a second reading
Tier: 1 (hz-03)
```gherkin
Given a draft whose make and model were filled by an earlier reading
When the seller replaces the make and the model with their own choice from the catalogue
And the seller attaches a second photograph of the registration document
And that reading returns a different make and model
Then the draft still carries the make and the model the seller chose
And the other fields carry what the second reading returned
```

### 6. Choosing from the catalogue answers the moderator question
Tier: 2
```gherkin
Given a draft whose model spelling was queued for a moderator
When the seller picks that model from the catalogue
Then the draft carries the catalogue model
And the queued question for this listing is closed
```

### 7. A second scan replaces the first
Tier: 2
```gherkin
Given a draft carrying a registration scan and a finished reading
When the seller attaches another registration photograph
Then the recognition is reported as running again
And a link to the stored scan resolves to the newer photograph
```

### 8. A published listing takes no new scan
Tier: 2 (hz-04)
```gherkin
Given a published listing
When its owner attaches a photograph of the registration document
Then the request is refused as not allowed in this state
And the listing is unchanged
```

### 9. The outcome outlives the connection that reported it
Tier: 1 (hz-07)
```gherkin
Given a seller who attached a photograph that could not be read
When the seller asks for the listing again on a new connection
Then the listing reports the recognition as unreadable
And it names the make and the model as filled by nobody
```

### 10. An unmatched model does not hold up the review
Tier: 1
```gherkin
Given a draft whose make matched the catalogue and whose model did not
And the price, the mileage, the phone number, the year and a photograph are filled
When the seller sends the listing for review
Then the listing is accepted for review
And it still carries the model spelling from the document
```

### 11. Ten sellers spelling one model the same way are one question
Tier: 2 (hz-02)
```gherkin
Given a model spelling already queued for a moderator
When another listing reading returns the same spelling for the same make
Then the moderator still has one question about that spelling
And the second listing carries the spelling too
```

### 12. A reading that finishes after its listing is gone changes nothing
Tier: 2 (hz-02)
```gherkin
Given a draft listing whose registration scan is being read
When the listing is deleted before the reading finishes
Then the reading ends without an error being raised to the seller
And no listing is created or modified by it
```
