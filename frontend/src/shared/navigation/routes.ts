// Карта маршрутов. Одно место, знающее адресное пространство приложения, — так же как
// `shared/api/endpoints.ts` знает адресное пространство сервера.
//
// Пути собраны здесь, а не разбросаны по `<Link to="/listings/…">`: переименование раздела
// иначе означает grep по строкам, а промах в grep — мёртвая ссылка, которую находит
// пользователь, а не сборка. Меняющиеся сегменты — функции.

export const ROUTES = {
  // Гость на корне видит лендинг, вошедший — ленту. Развилка живёт в `App`, а не в двух
  // разных адресах: ссылка на главную должна быть одна, кому бы её ни отправили.
  home: '/',
  // У лендинга свой адрес, а не только `/`: вошедшему главная отдаёт ленту, и без этого
  // маршрута страница «как это работает» была бы недостижима после первого же входа —
  // вместе со ссылками на неё из пустой ленты и из справки.
  landing: '/how-it-works',
  feed: '/feed',
  importFeed: '/import',
  listing: (id = ':listingId') => `/listings/${id}`,
  thicknessMap: (id = ':listingId') => `/listings/${id}/thickness`,
  seller: (id = ':userId') => `/sellers/${id}`,
  supplier: (id = ':supplierId') => `/suppliers/${id}`,
  importRequest: (id = ':requestId') => `/import-requests/${id}`,

  // Личное. Стена входа поднимается ровно в четырёх местах (UserFlows, поток 1), поэтому
  // защищённых маршрутов немного — почти всё публично и меняет лишь набор кнопок.
  selling: '/sell',
  // Тот же мастер, другой канал: вид объявления выбирается адресом входа, потому что
  // сменить его потом нельзя.
  sellingImport: '/sell?kind=import',
  // Продолжение начатого черновика. Отдельный адрес, а не состояние мастера: «Продолжить»
  // из «Моих объявлений» должно открываться по ссылке и переживать перезагрузку.
  sellingDraft: (id = ':saleCarId') => `/sell/${id}`,
  // Заполнение карты замеров — отдельный адрес от покупательской карты: там читают,
  // здесь пишут, и права у этих экранов разные.
  sellingThickness: (id = ':saleCarId') => `/sell/${id}/thickness`,
  myListings: '/my/listings',
  offers: '/my/offers',
  chats: '/my/chats',
  chat: (id = ':chatId') => `/my/chats/${id}`,
  profile: '/my/profile',
  supplierApplication: '/my/supplier-application',
  // Витрина поставщика: заполняется после одобрения роли и проходит свою модерацию.
  supplierProfile: '/my/supplier-profile',
  newImportRequest: '/import-requests/new',

  // Возврат от провайдера. Адрес зарегистрирован у Яндекса — менять его нельзя,
  // не поменяв настройки приложения на их стороне.
  oauthCallback: '/auth/callback',

  // Модерация. Разделы существуют только для `manager` и `admin`; для остальных маршрут
  // отдаёт «не найдено», а не «нет прав» — чужому человеку незачем знать, что тут что-то есть.
  moderationQueue: '/moderation/queue',
  moderationComplaints: '/moderation/complaints',
  moderationRoles: '/moderation/supplier-applications',
  moderationSuppliers: '/moderation/suppliers',
} as const
