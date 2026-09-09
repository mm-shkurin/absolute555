"""Борт из именованного SVG: панель — это фигура со своим именем, а не область,
угаданная заливкой. Всё, что не названо панелью, становится деталью: стёкла, фары,
фонари, зеркала, колёса — они обводятся, но не красятся.
"""
import json, re, sys

# Имя слоя в макете -> код панели. Задний бампер лежит в группе с именем переднего:
# в макете два слоя названы одинаково, и Figma развела их суффиксом.
NAMED = {
    'hood': 'hood',
    'roof': 'roof',
    'trunk': 'trunk_lid',
    'Rectangle 39747': 'trunk_lid',
    'Rectangle 39739': 'front_bumper',
    'Rectangle 39740': 'front_bumper',
    'Rectangle 39746': 'rear_bumper',
    "front left driver's door": 'front_left_door',
    'Rectangle 39744': 'rear_left_door',
    'back left fender_2': 'rear_left_fender',
    'Rectangle 39749': 'front_left_fender',
}

NUM = r'-?\d*\.?\d+(?:e-?\d+)?'


def elements(src):
    """Каждый рисующий элемент файла: имя, тип, геометрия."""
    for m in re.finditer(r'<(path|circle|rect|line|ellipse)\b([^>]*?)/?>', src):
        tag, attrs = m.group(1), m.group(2)
        ident = re.search(r'id="([^"]*)"', attrs)
        name = ident.group(1).replace('&#39;', "'") if ident else ''
        yield name, tag, attrs


def to_path(tag, attrs):
    """Круг и прямоугольник — те же контуры, только записанные иначе."""
    def num(key, default=0.0):
        m = re.search(rf'\b{key}="({NUM})"', attrs)
        return float(m.group(1)) if m else default

    if tag == 'path':
        m = re.search(r'\sd="([^"]*)"', attrs)
        return m.group(1) if m else ''
    if tag in ('circle', 'ellipse'):
        cx, cy = num('cx'), num('cy')
        rx = num('r') or num('rx')
        ry = num('r') or num('ry')
        k = 0.5523
        return (f'M{cx - rx} {cy}'
                f'C{cx - rx} {cy - ry * k} {cx - rx * k} {cy - ry} {cx} {cy - ry}'
                f'C{cx + rx * k} {cy - ry} {cx + rx} {cy - ry * k} {cx + rx} {cy}'
                f'C{cx + rx} {cy + ry * k} {cx + rx * k} {cy + ry} {cx} {cy + ry}'
                f'C{cx - rx * k} {cy + ry} {cx - rx} {cy + ry * k} {cx - rx} {cy}Z')
    if tag == 'rect':
        x, y, w, h = num('x'), num('y'), num('width'), num('height')
        return f'M{x} {y}H{x + w}V{y + h}H{x}Z'
    if tag == 'line':
        return f'M{num("x1")} {num("y1")}L{num("x2")} {num("y2")}'
    return ''


def rescale(d, fit):
    """Пересчёт пути в координаты схемы. Команды сохраняются: H и V остаются собой."""
    out, i = [], 0
    tokens = re.findall(rf'([MmLlCcSsQqTtAaHhVvZz])|({NUM})', d)
    cmd = ''
    while i < len(tokens):
        kind, val = tokens[i]
        if kind:
            cmd = kind
            out.append(cmd)
            i += 1
            continue
        if cmd in 'Hh':
            out.append(f'{fit(float(val), None)[0]:.1f}')
            i += 1
        elif cmd in 'Vv':
            out.append(f'{fit(None, float(val))[1]:.1f}')
            i += 1
        else:
            x, y = float(tokens[i][1]), float(tokens[i + 1][1])
            px, py = fit(x, y)
            out.append(f'{px:.1f} {py:.1f}')
            i += 2
    return ' '.join(out)


def main():
    src_path, out_dir = sys.argv[1], sys.argv[2]
    src = open(src_path, encoding='utf-8').read()
    w = float(re.search(r'width="(\d+)"', src).group(1))
    h = float(re.search(r'height="(\d+)"', src).group(1))
    bx, by, bw, bh = 250.0, 50.0, 520.0, 205.0
    k = min(bw / w, bh / h)
    ox, oy = bx + (bw - w * k) / 2, by + (bh - h * k) / 2

    def fit(x, y):
        return (ox + x * k if x is not None else 0.0,
                oy + y * k if y is not None else 0.0)

    zones, cutouts = {}, []
    for name, tag, attrs in elements(src):
        d = to_path(tag, attrs)
        if not d:
            continue
        moved = rescale(d, fit)
        code = NAMED.get(name)
        if code:
            zones.setdefault(code, []).append(moved)
        else:
            cutouts.append(moved)

    out = {'side': {
        'zones': [{'code': c, 'd': ' '.join(ds)} for c, ds in zones.items()],
        'outline': [],
        'cutouts': cutouts,
    }}
    json.dump(out, open(out_dir + '/paths.json', 'w'), ensure_ascii=False)
    print('панелей', len(out['side']['zones']), 'деталей', len(cutouts))


if __name__ == '__main__':
    main()
