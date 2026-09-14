# Журнал цикла покрытия — frontend

Формат: `дата время | # | тип | область | что | вывод`. Только добавление.

2026-09-14 15:00 | #0 | suite | front | старт замера | Tests 229 passed; lines 23.8% (629/2642)
2026-09-14 15:01 | #0 | audit | front | forecast 49.0–58.1% | цель 50%; src/dev (320 строк, фикстуры mock) оставлен в замере с долей 0 — решение пользователя
2026-09-14 15:02 | #1 | audit | selling | хуки 0%: useDraftSync, useGallery, useStsRecognition | подозрение: decodeVin шлёт JSON.stringify поверх сериализации httpClient
2026-09-14 15:20 | #1 | test  | selling/useDraftSync | «VIN, вписанный руками, уходит на распознавание» | red: expected '{"vin":"XW8ZZZ61ZJG012345"}' to deeply equal { vin: … }
2026-09-14 15:21 | #1 | fix   | shared/api/saleCarApi | decodeVin: тело объектом, сериализует httpClient | бэкенд ждёт VinDecodeRequest — строка давала 422
2026-09-14 15:21 | #1 | cover | selling/useDraftSync, useGallery | 12 сценариев зелёные сразу | ушёл и вернулся, черновик один раз, цена числом, фото, порядок, отказ лимита
2026-09-14 15:40 | #1 | cover | selling/useStsRecognition | 5 сценариев зелёные сразу | исход из потока, страховка по объявлению, исход один раз
2026-09-14 15:45 | #1 | cover | selling/useWizardServer | 5 сценариев зелёные сразу | возврат на первый пустой шаг, отказ отправки текстом, снимок не принят
2026-09-14 15:50 | #1 | suite | front | tsc exit 0; Test Files 46 passed; Tests 252 passed | lines 30.09% (+6.3), branches 24.11%, functions 22.39%
2026-09-14 16:00 | #1 | commit| selling | fix(frontend): слать VIN распознаванию объектом, покрыть хуки мастера |
2026-09-14 16:05 | #2 | audit | shared/api, shared/session | authorizedRequest, sendPublic, requestTimeout, httpResponse — строки без тестов | стыки: 401→refresh один раз, USER_BLOCKED, гость без токена, таймаут против отмены
2026-09-14 16:15 | #2 | cover | shared/session/authorizedRequest | 6 сценариев зелёные сразу | обновление токена, один refresh на три 401, истёкший refresh, закрытый доступ, запрет, без сессии
2026-09-14 16:15 | #2 | cover | shared/api/transport | 9 сценариев зелёные сразу | гость без токена, 502, нет сети, таймаут, отмена экраном, 204, отказ на blob
2026-09-14 16:20 | #2 | suite | front | tsc exit 0; Test Files 48 passed; Tests 267 passed | lines 31.83% (+1.7)
2026-09-14 16:21 | #2 | commit| shared/session, shared/api | test(frontend): покрыть сессию и транспорт запросов |
2026-09-14 16:25 | #3 | audit | moderation | moderationApi.toQueueItem подставляет константы вместо полей FeedCard | подозрение: thickness и listing_kind с провода не читаются, total_panels 11 при 13
2026-09-14 16:35 | #3 | test  | moderation/queue | «продавец заполнил карту — модератор видит полную карту», «под заказ» | red: expected '… отправлено 12…' to contain 'карта 13 из 13'; expected 'ждёт' to be 'под заказ'
2026-09-14 16:36 | #3 | fix   | moderation/api/moderationApi | toQueueItem читает thickness и listing_kind из FeedCard | вместо констант 0/11/false
2026-09-14 16:36 | #3 | skip  | moderation/queueView | VIN «нет — машина под заказ» у машины в наличии | сервер VIN в очереди не отдаёт; текст подписи — решение продукта
2026-09-14 16:40 | #3 | cover | moderation/queue | 4 сценария зелёные сразу | без карты, вкладки и числа, новый продавец, жалобы в строке
2026-09-14 16:45 | #3 | cover | moderation/decisions | 6 сценариев зелёные сразу | жалоба с причиной словами, отклонение жалобы, снятие с причиной, отклонение без комментария, публикация, повторная жалоба
2026-09-14 16:50 | #3 | suite | front | tsc exit 0; Test Files 50 passed; Tests 279 passed | lines 33.08% (+1.3), branches 26.27%, functions 25.33%
2026-09-14 16:51 | #3 | commit| moderation | fix(frontend): показывать модератору карту замеров и привоз из выдачи |
2026-09-14 17:00 | #4 | audit | moderation (страницы) | 7 страниц .tsx без тестов; один рендер страницы дал +3 п.п. | помощник renderPage: MemoryRouter + свой QueryClient без повторов
2026-09-14 17:05 | #4 | cover | moderation/ModerationQueuePage | 6 сценариев зелёные сразу | первая карточка открыта, выбор строки, публикация, отклонение только с причиной, пусто, отказ
2026-09-14 17:10 | #4 | cover | moderation/ComplaintsPage | 5 сценариев зелёные сразу | жалобы в одной карточке, отклонить все, снятие через причину, пусто, отказ загрузки
2026-09-14 17:20 | #4 | cover | moderation/RoleApplicationsPage, SupplierQueuePage | 12 сценариев зелёные сразу | одобрение, отказ только с текстом, разобранная без кнопок, вкладки; витрина поверх правки, отказ с причиной
2026-09-14 17:25 | #4 | cover | moderation/AdminSummaryPage | 2 сценария зелёные сразу | плитки с числами сервера ведут в разделы, отказ сводки
2026-09-14 17:35 | #4 | cover | moderation/PeoplePage, PersonPage | 13 сценариев зелёные | роли и входы словами, поиск по кнопке, страницы, причина до запроса, отказ сервера, журнал только админу
2026-09-14 17:36 | #4 | test  | test/fakeServer | два падения — ошибки теста, не продукта | дубль «Яндекс» в данных; маршрут из beforeEach перекрывал тестовый — теперь побеждает последний
2026-09-14 17:40 | #4 | suite | front | tsc exit 0; Test Files 57 passed; Tests 317 passed | lines 41.86% (+8.8), branches 35.1%, functions 36.53%
2026-09-14 17:41 | #4 | commit| moderation (страницы) | test(frontend): покрыть страницы кабинета модерации |
2026-09-14 17:45 | #5 | audit | listing | ListingPage, useListing, useListingActions, панели и шторки без тестов | выключенный e2e «покупатель видит чужие предложения» — поведение есть в коде, проверяемо на уровне страницы
2026-09-14 17:55 | #5 | cover | listing/ListingPage | 12 сценариев зелёные сразу | гость на вход, цена с пробелами числом, LISTING_SOLD словами, телефон, скрытый телефон, жалоба с причиной, открытый торг, владелец снимает, неполная карта, продано, 404
