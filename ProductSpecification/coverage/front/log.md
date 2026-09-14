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
