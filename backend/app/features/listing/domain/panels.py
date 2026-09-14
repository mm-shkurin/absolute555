"""Панели кузова и то, как читается замер толщиномера.

Набор панелей живёт здесь, а не в таблице: он не меняется от машины к машине, и
справочник из тринадцати строк, который никто не редактирует, — это таблица, которую
нужно наполнять миграцией, засевать в тестах и джойнить в каждом чтении карты.

Пороги тоже здесь и считаются на сервере. Клиент красит панель по `status`, а не по
числу: порог, посчитанный в вебе и в мобилке, — это две копии одного правила, и они
разойдутся на первой же правке.
"""

from dataclasses import dataclass
from enum import Enum


class BodyPanel(str, Enum):
    HOOD = "hood"
    ROOF = "roof"
    TRUNK_LID = "trunk_lid"
    FRONT_LEFT_DOOR = "front_left_door"
    FRONT_RIGHT_DOOR = "front_right_door"
    REAR_LEFT_DOOR = "rear_left_door"
    REAR_RIGHT_DOOR = "rear_right_door"
    FRONT_LEFT_FENDER = "front_left_fender"
    FRONT_RIGHT_FENDER = "front_right_fender"
    REAR_LEFT_FENDER = "rear_left_fender"
    REAR_RIGHT_FENDER = "rear_right_fender"
    FRONT_BUMPER = "front_bumper"
    REAR_BUMPER = "rear_bumper"


class PanelStatus(str, Enum):
    FACTORY = "factory"
    REPAINT = "repaint"
    FILLER = "filler"


TOTAL_PANELS = len(BodyPanel)

# Ноль и отрицательное прибор не показывает.
MIN_VALUE_UM = 1


@dataclass(frozen=True)
class Thresholds:
    repaint_from_um: int
    filler_from_um: int


def status_of(value_um: int, thresholds: Thresholds) -> PanelStatus:
    if value_um >= thresholds.filler_from_um:
        return PanelStatus.FILLER
    if value_um >= thresholds.repaint_from_um:
        return PanelStatus.REPAINT
    return PanelStatus.FACTORY


class ValueSource(str, Enum):
    OCR = "ocr"
    SELLER = "seller"
