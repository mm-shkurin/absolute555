"""Чем бывает «идентификационный номер» в российском СТС.

Правило «семнадцать символов, иначе не прочитано» верно только для половины рынка. На
восьми настоящих свидетельствах из Омска четыре оказались без VIN: у праворульных
японских машин в этой строке стоит номер кузова (`GB6-1000952`, `RN7-3100986`,
`NHP130-2010843`), а у одной написано «ОТСУТСТВУЕТ» и номер живёт в строке кузова.

Поэтому строка не проверяется, а классифицируется: VIN, номер кузова, явное отсутствие
или нечитаемое. Разница видна продавцу и решает, что показывать в мастере: пустое поле
для ввода или прочитанное значение, которое достаточно подтвердить.
"""

import re
from enum import Enum

# ISO 3779: семнадцать символов, буквы I, O и Q исключены, чтобы их не путали с 1 и 0.
VIN = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")

# Номер кузова японской машины: буквенно-цифровой код модели, дефис, серийный номер.
# Длина плавает (GB6-1000952, NHP130-2010843), поэтому проверяется форма, а не размер.
BODY_NUMBER = re.compile(r"^[A-Z]{1,4}[A-Z0-9]{0,4}-?[0-9]{5,8}$")

# Проверяются до замены кириллических двойников: после неё «ОТСУТСТВУЕТ» превращается
# в «OTCYTCTBYET» и перестаёт быть словом.
ABSENT_WORDS = {"ОТСУТСТВУЕТ", "ОТСУТСВУЕТ", "НЕТ", "NONE", "ABSENT", "-"}


class NumberKind(str, Enum):
    VIN = "vin"
    BODY = "body"
    ABSENT = "absent"
    UNREADABLE = "unreadable"


def normalise(value) -> str:
    """Верхний регистр без пробелов, кириллические двойники — в латиницу.

    OCR читает Х, М, С и О русскими буквами: на глаз это те же символы, для сравнения
    строк — разные, и правильно прочитанный VIN не совпадает сам с собой.
    """
    if value is None:
        return ""
    flat = re.sub(r"[\s]", "", str(value).upper())
    return flat.translate(
        str.maketrans(
            {
                "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "О": "O",
                "Р": "P", "С": "C", "Т": "T", "У": "Y", "Х": "X", "І": "I", "Ѕ": "S",
            }
        )
    )


def is_absent(value) -> bool:
    return re.sub(r"[\s]", "", str(value or "").upper()) in ABSENT_WORDS


def classify(value) -> NumberKind:
    if is_absent(value):
        return NumberKind.ABSENT

    flat = normalise(value)
    if not flat:
        return NumberKind.UNREADABLE
    if VIN.match(flat.replace("-", "")):
        return NumberKind.VIN
    if BODY_NUMBER.match(flat):
        return NumberKind.BODY
    return NumberKind.UNREADABLE


def readable(value) -> bool:
    return classify(value) in (NumberKind.VIN, NumberKind.BODY)
