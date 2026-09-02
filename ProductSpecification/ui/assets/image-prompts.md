# Промпты для генерации картинок лендинга

Пять серых плейсхолдеров на лендинге + чертёж кузова. Не всё стоит генерировать —
разделение внизу объяснено.

## Что генерировать, а что нет

| Плейсхолдер | Кто делает | Почему |
|---|---|---|
| Кадр «камера наведена на СТС» | **Gemini** | Фотосцена, руки, телефон, документ |
| Кадр «форма с подсвеченными полями» | **Скриншот нашего мокапа** | Это наш интерфейс. Генерённый UI будет чужим и с кривым текстом |
| Кадр «список офферов» | **Скриншот нашего мокапа** | То же |
| «Макет карточки объявления» 4:5 | **Скриншот нашего мокапа** | То же |
| «Снимок приложения на телефоне» 16:11 | **Gemini фон + наш скриншот сверху** | Генерим руку с телефоном и двор, экран вклеиваем свой |
| Чертёж кузова (5 проекций) | **Gemini как референс → я обвожу в SVG** | Нужны кликабельные зоны, растр не подойдёт |

Скриншоты UI сделаю сам, когда домалюю соответствующие экраны. От тебя нужны
только фотосцены и чертёж.

---

## Общий блок стиля

Вставляй его в **каждый** промпт — тогда картинки лягут в один ряд.

```
STYLE: clean modern product photography for a Russian used-car marketplace.
Cool daylight, soft diffused light, no harsh shadows. Palette limited to
cool blue-greys #F2F7FF, #E1EAF7, #7A88A3, deep near-black #0A1020, with a
single saturated brand blue accent #0066FF. Muted, slightly desaturated,
calm and trustworthy — not glossy advertising, not moody cinematic.
Realistic, believable Russian setting. Sharp focus on the subject,
background softly out of focus.

NEGATIVE: no text, no letters, no logos, no watermark, no brand names,
no license plate numbers, no faces, no distorted hands, no extra fingers,
no HDR, no orange or teal color grading, no lens flare, no vignette,
no stock-photo smiling models, no 3D render look.
```

Про «no text»: у генераторов кириллица получается мусором. Всё текстовое —
из нашей вёрстки поверх картинки.

---

## 1. Кадр «камера наведена на СТС»

Секция «Как это работает», шаг 1. Формат **4:3**.

```
[STYLE BLOCK]

Close-up over-the-shoulder shot: a person's hands hold a smartphone in
portrait orientation, camera pointed down at a Russian vehicle registration
document lying on the dark grey fabric seat of a car. The phone screen shows
the live camera view of the document with a thin bright blue #0066FF
rectangular scan frame overlaid on it. Daylight from a side window.
Shallow depth of field: the phone and document sharp, car interior blurred.
Composition leaves clean empty space in the upper third.
Aspect ratio 4:3.
```

Если документ выходит нечитаемо-мусорным текстом — так и надо, замыливай ещё
сильнее. Реальный СТС в кадре быть не должен.

---

## 2. Фон под «снимок приложения на телефоне»

Секция Android. Формат **16:11**. Экран телефона потом заменю нашим скриншотом,
поэтому просим **пустой светлый экран**.

```
[STYLE BLOCK]

A person stands in a residential courtyard in a Russian city, holding a
smartphone vertically at chest height, photographing a parked sedan a few
metres away. Seen from behind and slightly to the side. The phone screen is
blank light grey — no interface, no content. Overcast soft daylight, panel
apartment buildings and bare trees blurred in the background, wet asphalt.
The car is a generic silver sedan, no visible badge or plate.
Composition: phone in the left third, car in the right third.
Aspect ratio 16:11.
```

---

## 3. Опциональный герой-кадр (если захочешь заменить чертёж)

Формат **4:3**. Пока не нужен, но пусть будет.

```
[STYLE BLOCK]

A hand presses a small paint thickness gauge against the front fender of a
dark grey sedan. Extreme close-up, the gauge device sharp in focus, its
display blank (no numbers). Car body panel fills the frame with a smooth
reflective surface catching cool sky light. Slight blue reflection on the
paint. Aspect ratio 4:3.
```

---

## 4. Чертёж кузова — 5 проекций

Это **референс**, а не финальный ассет: я обведу его в SVG, чтобы панели
кликались. Формат **4:3**, светлый фон.

```
Technical blueprint line drawing of a generic four-door sedan, five
orthographic projections arranged on one sheet: side view, front view,
rear view, top view and a second side view. Pure outline vector style —
thin uniform strokes, no shading, no fill, no perspective, no colour.
Lines in cool grey #A8BBD8 on a plain white background. Panel seams clearly
drawn: hood, roof, trunk lid, four doors, four fenders, front and rear
bumpers each separated by a visible line. Wheels drawn as simple concentric
circles. Clean, precise, engineering drawing aesthetic.

NEGATIVE: no dimensions, no arrows, no annotations, no text, no numbers,
no grid, no watermark, no logo, no shading, no gradient, no 3D, no photo.
```

Ключевое требование — **швы между панелями видны отдельными линиями**. Если
Gemini рисует кузов одним контуром, добавь в конец промпта:
`Each body panel must be outlined as a separate closed shape.`

---

## Что искать в интернете как пример

Кидай Gemini картинку + промпт — так попадание сильно выше.

**Под чертёж кузова (самое важное):**
- `car blueprint 5 views vector` — то, что ты уже прислал, годится как есть
- `the-blueprints.com sedan` — база технических чертежей, там ортогональные проекции
- `car damage diagram insurance form` — схемы повреждений в страховых актах,
  видно, как разделяют панели
- `vehicle inspection body panel diagram` — то же с подписями панелей

**Под фотосцены:**
- `hands holding phone scanning document` — композиция для шага 1
- `car interior document on seat natural light` — свет и фактура
- `person photographing car with smartphone` — для Android-секции
- `paint thickness gauge on car body` — для замера

**Под общий тон (покажи как «вот такая палитра и настроение»):**
- Скриншоты нашего же лендинга — открой мокап и сними экран, это лучший референс
  по цвету
- `cool blue product photography soft daylight` — если нужен чистый пример тона

---

## Куда класть готовое

`ProductSpecification/ui/assets/` под именами:

```
land-scan-sts.jpg      кадр со сканом СТС      1600×1200
land-app-yard.jpg      двор с телефоном        1600×1100
land-gauge.jpg         толщиномер (опц.)       1600×1200
blueprint-ref.png      чертёж-референс         любой
```

Скинь — вставлю в лендинг вместо серых плашек.
