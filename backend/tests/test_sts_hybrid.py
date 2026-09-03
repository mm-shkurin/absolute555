"""Как спорят два читателя документа и что из спора видит продавец.

Правило простое и держится на замере: согласие двух читателей на корпусе ни разу не было
ложным, а расхождение поймало ровно ту ошибку, которую формой не отличить —
`WBASA31090D123456` вместо `WBA5A31090D123456`: семнадцать символов, алфавит верный,
любую проверку проходит, а машина по нему чужая.

Эталоны здесь взяты с восьми настоящих свидетельств. Четыре из них — без VIN: у
праворульных японских машин в этой строке номер кузова, а у одной прямо написано
«ОТСУТСТВУЕТ». Правило «семнадцать символов, иначе не прочитано» выбросило бы половину
омского рынка.
"""

import pytest

from app.ml.sts_reader import combine_number, read_document
from app.ml.vin_shape import NumberKind, classify

VIN_JEEP = "1J4FJ28S1NL250758"
VIN_ALMERA = "Z8NAJL11055493579"
BODY_FREED = "GB6-1000952"


def vision_answer(**fields):
    base = {
        "plate": None, "vin": None, "mark": None, "model": None,
        "year": None, "power": None, "body": None, "color": None,
    }
    base.update(fields)
    return lambda body: base


class TestНомерПоДвумЧтениям:
    def test_should_accept_a_number_both_readers_agree_on(self):
        verdict = combine_number(VIN_JEEP, VIN_JEEP)

        assert verdict["value"] == VIN_JEEP
        assert verdict["kind"] is NumberKind.VIN
        assert verdict["agreed"] is True

    def test_should_flag_a_number_the_readers_disagree_on(self):
        """Обе строки проходят проверку формы — отличить их может только расхождение."""
        verdict = combine_number("WBA5A31090D123456", "WBASA31090D123456")

        assert verdict["agreed"] is False
        # Посимвольный читатель точнее на длинной случайной строке, но пометка остаётся.
        assert verdict["value"] == "WBASA31090D123456"

    def test_should_take_the_only_reading_there_is(self):
        verdict = combine_number(VIN_ALMERA, None)

        assert verdict["value"] == VIN_ALMERA
        assert verdict["agreed"] is False

    def test_should_take_the_second_opinion_when_vision_lost_a_character(self):
        """Шестнадцать символов — потерянный символ, а не второй кандидат."""
        verdict = combine_number("Z8NAJL1105549357", VIN_ALMERA)

        assert verdict["value"] == VIN_ALMERA
        assert verdict["kind"] is NumberKind.VIN

    def test_should_leave_the_number_empty_when_neither_reader_managed(self):
        verdict = combine_number("???", "")

        assert verdict["value"] is None
        assert verdict["kind"] is NumberKind.UNREADABLE

    def test_should_ignore_the_alphabet_the_reader_happened_to_use(self):
        """Кириллические Х, В, С — те же символы на глаз; расхождением это не считается."""
        verdict = combine_number("ХWВ5V319DЕА571433", "XWB5V319DEA571433")

        assert verdict["agreed"] is True
        assert verdict["value"] == "XWB5V319DEA571433"


class TestМашиныБезVIN:
    def test_should_keep_a_japanese_body_number(self):
        """У праворульной машины VIN не выдавали: номер кузова — это прочитанный номер."""
        verdict = combine_number(BODY_FREED, BODY_FREED)

        assert verdict["kind"] is NumberKind.BODY
        assert verdict["value"] == BODY_FREED

    @pytest.mark.parametrize("number", ["RN7-3100986", "NHP130-2010843", "ES21400840"])
    def test_should_recognise_the_shapes_a_body_number_takes(self, number):
        assert classify(number) is NumberKind.BODY

    def test_should_record_an_explicitly_absent_number(self):
        """«ОТСУТСТВУЕТ» — прочитанный факт, а не сбой чтения."""
        verdict = combine_number("ОТСУТСТВУЕТ", None)

        assert verdict["kind"] is NumberKind.ABSENT
        assert verdict["value"] is None
        assert verdict["agreed"] is True

    def test_should_put_a_body_number_in_its_own_field(self):
        fields = read_document(
            b"picture",
            vision=vision_answer(vin=BODY_FREED, mark="HONDA", model="FREED PLUS"),
            second_opinion=lambda body: BODY_FREED,
        )

        assert fields["vin"] is None
        assert fields["body_number"] == BODY_FREED
        assert fields["number_kind"] == "body"


class TestЧтениеДокументаЦеликом:
    def test_should_take_every_other_field_from_vision(self):
        fields = read_document(
            b"picture",
            vision=vision_answer(
                vin=VIN_JEEP, mark="JEEP", model="CHEROKEE", year="1992", power="185"
            ),
            second_opinion=lambda body: VIN_JEEP,
        )

        assert fields["mark"] == "JEEP"
        assert fields["model"] == "CHEROKEE"
        assert fields["year"] == "1992"
        assert fields["power"] == "185"
        assert fields["number_agreed"] is True

    def test_should_survive_a_second_opinion_that_falls_over(self):
        """Второй читатель — уточнение, а не условие: его падение не уносит документ."""

        def _broken(body):
            raise RuntimeError("tesseract died")

        fields = read_document(
            b"picture",
            vision=vision_answer(vin=VIN_ALMERA, mark="NISSAN", model="ALMERA"),
            second_opinion=_broken,
        )

        assert fields["vin"] == VIN_ALMERA
        assert fields["number_agreed"] is False
        assert fields["mark"] == "NISSAN"

    def test_should_work_without_a_second_reader_at_all(self):
        fields = read_document(
            b"picture", vision=vision_answer(vin=VIN_JEEP, mark="JEEP"), second_opinion=None
        )

        assert fields["vin"] == VIN_JEEP
        assert fields["number_agreed"] is False


@pytest.mark.asyncio
async def test_should_hand_the_task_both_the_number_and_its_confidence(monkeypatch):
    from app.ml.decode_vin import decode_vin

    monkeypatch.setattr(
        "app.ml.decode_vin.read_sts",
        lambda body: {"vin": VIN_JEEP, "mark": "JEEP", "model": "CHEROKEE", "year": "1992",
                      "power": "185", "plate": "К568ТВ55", "body": None, "color": "БЕЛЫЙ"},
    )
    monkeypatch.setattr("app.ml.decode_vin.read_number", lambda body: VIN_JEEP)

    decoded = await decode_vin(b"picture")

    assert decoded["vin"] == VIN_JEEP
    assert decoded["number_kind"] == "vin"
    assert decoded["number_agreed"] is True
    assert decoded["transmission"] is None


@pytest.mark.asyncio
async def test_should_publish_a_japanese_car_without_a_vin(monkeypatch):
    """Документ прочитан целиком, VIN в нём нет — это не «не распознано»."""
    from app.ml.decode_vin import decode_vin

    monkeypatch.setattr(
        "app.ml.decode_vin.read_sts",
        lambda body: {"vin": "ОТСУТСТВУЕТ", "mark": "HONDA", "model": "CIVIC FERIO",
                      "year": "2006", "power": None, "plate": "У271ОМ55",
                      "body": "ES21400840", "color": "БЕЛЫЙ"},
    )
    monkeypatch.setattr("app.ml.decode_vin.read_number", lambda body: None)

    decoded = await decode_vin(b"picture")

    assert decoded["vin"] is None
    assert decoded["number_kind"] == "absent"
    assert decoded["mark"] == "HONDA"
    assert "error" not in decoded
