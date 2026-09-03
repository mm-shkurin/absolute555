"""Два читателя одного документа и правило, по которому они спорят.

Замер на корпусе показал, что читатели ошибаются по-разному. Зрение модели теряет символ
в длинной случайной строке (`ZJG012345` → `ZJ012345`) и подменяет похожий (`E` → `F`), но
уверенно читает всё остальное. Tesseract, наоборот, берёт VIN посимвольно и точнее (9/12
против 4/12), а марку с моделью путает алфавитом.

    исход                     случаев из 12
    оба дали один и тот же VIN, верный        3
    оба согласны и ошиблись                   0
    разошлись (у одного из двух — верный)     7
    ни у кого нет кандидата                   2

Согласие ни разу не было ложным — на нём номер можно принимать молча. Расхождение же
ловит ту ошибку, которую формой не отличить: `WBASA31090D123456` — семнадцать символов,
алфавит верный, проверку проходит, а машина по нему чужая. Поэтому расхождение не
разрешается голосованием, а помечается: продавец подтверждает номер сам.
"""

from typing import Callable, Optional

from loguru import logger

from app.ml.vin_shape import NumberKind, classify, normalise

# Кто читает точнее посимвольно. При равной форме и разных ответах берётся его вариант,
# но пометка «подтвердите» остаётся.
CHAR_READER = "ocr"


def combine_number(vision_value, ocr_value) -> dict:
    """Идентификационный номер по двум чтениям.

    Возвращает значение, его вид и то, сошлись ли читатели: экран показывает
    подтверждённый номер иначе, чем спорный.
    """
    # Классифицируется исходная строка, а не приведённая: замена кириллических двойников
    # превращает «ОТСУТСТВУЕТ» в «OTCYTCTBYET», и явное отсутствие читается как мусор.
    vision_kind, ocr_kind = classify(vision_value), classify(ocr_value)
    vision, ocr = normalise(vision_value), normalise(ocr_value)

    vision_ok = vision_kind in (NumberKind.VIN, NumberKind.BODY)
    ocr_ok = ocr_kind in (NumberKind.VIN, NumberKind.BODY)

    if NumberKind.ABSENT in (vision_kind, ocr_kind) and not (vision_ok and ocr_ok):
        # В документе написано «ОТСУТСТВУЕТ». Это прочитанный факт, а не сбой чтения.
        return {"value": None, "kind": NumberKind.ABSENT, "agreed": True, "source": "vision"}

    if vision_kind is NumberKind.BODY:
        # Номер кузова спорить не с кем: второй читатель видит только сплошной текст, а
        # в нём эта строка неотличима от серии бланка и номера ПТС — на настоящих
        # свидетельствах он предлагал именно их.
        return {"value": vision, "kind": NumberKind.BODY, "agreed": not ocr_ok, "source": "vision"}

    if vision_ok and ocr_ok:
        if vision == ocr:
            return {"value": vision, "kind": vision_kind, "agreed": True, "source": "both"}
        logger.info("readers disagree on the identification number")
        return {"value": ocr, "kind": ocr_kind, "agreed": False, "source": CHAR_READER}

    if vision_ok:
        return {"value": vision, "kind": vision_kind, "agreed": False, "source": "vision"}
    if ocr_ok:
        return {"value": ocr, "kind": ocr_kind, "agreed": False, "source": CHAR_READER}

    return {"value": None, "kind": NumberKind.UNREADABLE, "agreed": False, "source": None}


def read_document(
    body: bytes,
    vision: Callable[[bytes], dict],
    second_opinion: Optional[Callable[[bytes], Optional[str]]] = None,
) -> dict:
    """Поля документа: всё от зрения, номер — по согласию двух читателей.

    Второе мнение необязательно: без него номер приезжает неподтверждённым, но чтение
    не срывается. Так конвейер переживает выключенный tesseract и наоборот.
    """
    fields = dict(vision(body))

    ocr_number = None
    if second_opinion is not None:
        try:
            ocr_number = second_opinion(body)
        except Exception as error:
            # Второй читатель — уточнение, а не условие. Его падение не должно уносить
            # уже прочитанный документ.
            logger.warning(f"second opinion on the number failed: {error}")

    verdict = combine_number(fields.get("vin"), ocr_number)
    fields["vin"] = verdict["value"] if verdict["kind"] == NumberKind.VIN else None
    fields["body_number"] = verdict["value"] if verdict["kind"] == NumberKind.BODY else None
    fields["number_kind"] = verdict["kind"].value
    fields["number_agreed"] = verdict["agreed"]
    return fields
