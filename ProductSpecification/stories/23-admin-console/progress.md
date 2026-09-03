# 23 — Админка: люди, роли, блокировки, сводка

## Spec

- [x] interview
- [S] mockups — консоль строится из существующих компонентов модерации
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 blocking a person closes the door and says why
- [x] api-02 unblocking gives the door back
- [x] api-07 the listings of a blocked seller leave the feed and come back
- [x] api-08 the journal records who did what and why
- [x] api-09 changing a role is recorded with its reason
- [x] api-10 the list of people arrives a page at a time

## Tier 1 — Security

- [x] sec-01 an ordinary user finds no admin routes
- [x] sec-03 a moderator does not close the door on their own level

## Tier 1 — Frontend

- [x] ui-01 the moderator finds the way in from the header
- [x] ui-03 the summary says where the work has piled up

- [x] harvest

## Tier 2 — Backend

- [x] api-03 a block without a reason is refused
- [x] api-04 nobody blocks themselves
- [x] api-05 a block is not applied twice
- [x] api-06 unblocking someone who was never blocked
- [x] api-11 the list narrows by name, by role and by access
- [x] api-12 a person's card carries what a moderator needs to judge

## Tier 2 — Security

- [x] sec-02 a moderator sees people but does not touch roles
- [x] sec-05 a blocked administrator loses their own console

## Tier 2 — Frontend

- [x] ui-02 an ordinary person is not told the console exists
- [x] ui-04 the people screen searches and pages
- [x] ui-05 blocking asks for a reason before it acts
- [x] ui-06 the card shows the journal to an administrator only
- [x] ui-07 the blocked person is told plainly

## Tier 2 — Infrastructure

- [x] inf-02 the revision that adds the block rolls back

## Tier 2 — Integration

- [~] int-01 from complaint to closed door
