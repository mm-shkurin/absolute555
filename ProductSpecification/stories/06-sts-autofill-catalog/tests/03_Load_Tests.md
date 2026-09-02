# Load Tests — Автозаполнение из СТС: привязка к справочнику

Load = n/a.

`ProductSpecification/ExpectedLoad.md` names reading the СТС as the one expensive path
and bounds it explicitly: it runs on the queue rather than in the request, and it is
bounded by how often a seller creates a listing — tens per day, not per second. No
declared Load Challenge Profile is exercised.

The two consequences of that path worth checking are correctness, not throughput, and
both are in `01_API_Tests.md`: a reading finishing after its listing is gone (scenario
12), and one spelling queued once however many listings carry it (scenario 11).
