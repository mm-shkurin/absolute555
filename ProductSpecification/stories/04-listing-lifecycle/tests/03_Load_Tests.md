# Load Tests — Объявление: черновик и жизненный цикл статусов

Load = n/a.

`ProductSpecification/ExpectedLoad.md` puts the project at tens of new listings a day
and hundreds of active listings, and names the feed read path as the only volume of
consequence. Status transitions are the rarest writes in that picture — one per listing
per lifecycle step, bounded by how often a human sells a car. No declared Load Challenge
Profile is exercised by this story, so no load scenario is drafted.

The one contention this story does create is two actions racing on one listing, and that
is a correctness question, not a throughput one — it is covered by scenario 17 of
`01_API_Tests.md`.
