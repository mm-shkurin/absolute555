# Load Tests — Фото объявления: загрузка, порядок, обложка

Load = n/a.

`ProductSpecification/ExpectedLoad.md` puts the project at tens of new listings a day,
and names the feed read path as the only volume of consequence. Photo upload is the
heaviest single write this project has — up to fifteen files of ten megabytes — but it
is bounded by how often a human sells a car, and it exercises no declared Load Challenge
Profile.

Two consequences of that load are still worth testing, and both are correctness rather
than throughput: two uploads racing on one gallery (scenario 18 of `01_API_Tests.md`)
and a single request that could carry more than the gallery may hold (scenario 19).
