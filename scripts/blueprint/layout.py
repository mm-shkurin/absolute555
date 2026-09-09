"""Разметка чертежа: какие области принадлежат панелям и где лежит проекция.
Единственная ручная часть конвейера — всё остальное считается из чертежа.
"""
# Ячейки чертежа, назначенные панелям. Номера — из трассировки исходного чертежа.
PANELS = {
    'side': {
        'hood': [28, 26], 'roof': [2], 'trunk_lid': [3, 11],
        'front_left_fender': [39, 37], 'front_left_door': [34, 27],
        'rear_left_door': [33, 23], 'rear_left_fender': [30],
        'front_bumper': [51, 61, 65], 'rear_bumper': [48, 57],
    },
    'top': {
        'hood': [141], 'roof': [139], 'trunk_lid': [135],
        'front_left_fender': [111], 'front_right_fender': [164],
        'front_left_door': [103], 'rear_left_door': [107],
        'front_right_door': [176], 'rear_right_door': [178],
        'rear_left_fender': [102], 'rear_right_fender': [183],
        'front_bumper': [79], 'rear_bumper': [143],
    },
    'front': {
        'hood': [144], 'front_bumper': [83, 80],
        'front_left_fender': [162], 'front_right_fender': [122],
    },
    'rear': {
        'trunk_lid': [140, 138, 136], 'rear_bumper': [87, 97],
        'rear_left_fender': [168, 169], 'rear_right_fender': [130, 112],
    },
}

# Область чертежа, поворот и целевой прямоугольник (x, y, ширина, высота).
VIEWS = {
    'side':  dict(src=(360, 0, 2970, 715),     rot=0,   box=(250, 55, 520, 200)),
    'front': dict(src=(0, 669, 705, 1629),     rot=-90, box=(30, 300, 190, 220)),
    'top':   dict(src=(705, 729, 2970, 1629),  rot=0,   box=(248, 292, 524, 236)),
    'rear':  dict(src=(2970, 669, 3636, 1629), rot=90,  box=(806, 300, 190, 220)),
}


# Вид слева нарисован отдельно и крупнее общего чертежа: свои области, свой растр.
SIDE_PANELS = {
    'side': {
        'hood': [19], 'roof': [2], 'trunk_lid': [7, 6, 15],
        'front_left_fender': [25], 'front_left_door': [29, 4],
        'rear_left_door': [28, 5], 'rear_left_fender': [26],
        'front_bumper': [42, 48, 52], 'rear_bumper': [38, 45],
    },
}

SIDE_VIEWS = {
    'side': dict(src=(0, 0, 2940, 900), rot=0, box=(250, 50, 520, 205)),
}

# Наборы: у общего чертежа номера областей приходят через якоря, у отдельного вида —
# напрямую из его собственной трассировки.
SETS = {
    'blueprint': (PANELS, VIEWS, True),
    'side': (SIDE_PANELS, SIDE_VIEWS, False),
}
