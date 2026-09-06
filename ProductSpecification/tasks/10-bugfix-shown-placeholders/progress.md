# 10 — bugfix: заглушки там, где картинки уже есть

## Steps

- [x] design
- [x] `shared/ui/Cover` и переезд `Gallery.Shot`
- [x] обложки: myListings (провод + вид), offers, moderation (жалобы, очередь)
- [x] аватары: complaintView, DialogList, SiteHeader + сессия, SellerBlock, sellerProfile
- [x] правка 15: убрать обёртку `.cards`, проп `columns` у `ListingGrid`
- [x] прогон `bash scripts/ci-local.sh --frontend`
- [x] терминальный ревью-батч: аватары вернулись к прежним размерам, находка про планшет отклонена
- [~] архив в `tasks/done/`
