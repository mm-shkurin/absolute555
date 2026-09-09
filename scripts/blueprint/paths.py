import json, sys
import numpy as np
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
import contour
from layout import SETS

SP = sys.argv[1]
PANELS, VIEWS, USE_ANCHORS = SETS[sys.argv[2] if len(sys.argv) > 2 else 'blueprint']
PANELS, VIEWS, USE_ANCHORS = SETS[sys.argv[2] if len(sys.argv) > 2 else 'blueprint']
label = np.load(SP + '/labels.npy')
cells = {c['id']: c for c in json.load(open(SP + '/cells.json'))}
HERE = __import__('pathlib').Path(__file__).parent
POINTS = {int(k): v for k, v in json.load(open(HERE / 'anchors.json')).items()}


def _cell_at(x, y):
    v = int(label[y, x])
    if v > 0:
        return v
    for r in range(1, 14):
        box = label[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1]
        vals = box[box > 0]
        if len(vals):
            return int(np.bincount(vals).argmax())
    return 0


ANCHORS = {k: _cell_at(x, y) for k, (x, y) in POINTS.items()} if USE_ANCHORS else {} if USE_ANCHORS else {}


def resolve(old_id):
    return ANCHORS[old_id]

if USE_ANCHORS:
    PANELS = {view: {code: [resolve(i) for i in ids if i in ANCHORS]
                     for code, ids in group.items()}
              for view, group in PANELS.items()}



def cells_in(src):
    x0, y0, x1, y1 = src
    return [c for c in cells.values() if x0 <= c['cx'] < x1 and y0 <= c['cy'] < y1]


def mask_of(ids, src):
    x0, y0, x1, y1 = src
    sub = label[y0:y1, x0:x1]
    m = np.zeros(sub.shape, bool)
    for i in ids:
        m |= sub == i
    return m


def fitter(view):
    """Перенос пикселя чертежа в координаты схемы: поворот, масштаб, сдвиг."""
    src, rot, box = view['src'], view['rot'], view['box']
    ids = [c['id'] for c in cells_in(src)]
    m = mask_of(ids, src)
    ys, xs = np.nonzero(m)
    ax0, ay0, ax1, ay1 = xs.min(), ys.min(), xs.max(), ys.max()

    def turn(x, y):
        if rot == -90:
            return (y, -x)
        if rot == 90:
            return (-y, x)
        return (x, y)

    corners = [turn(x, y) for x, y in ((ax0, ay0), (ax1, ay0), (ax0, ay1), (ax1, ay1))]
    tx0 = min(c[0] for c in corners); tx1 = max(c[0] for c in corners)
    ty0 = min(c[1] for c in corners); ty1 = max(c[1] for c in corners)
    bx, by, bw, bh = box
    k = min(bw / (tx1 - tx0), bh / (ty1 - ty0))
    ox = bx + (bw - (tx1 - tx0) * k) / 2
    oy = by + (bh - (ty1 - ty0) * k) / 2

    def to_view(p):
        x, y = turn(p[0], p[1])
        return (round(ox + (x - tx0) * k, 1), round(oy + (y - ty0) * k, 1))

    return to_view, ids


def parts(m, floor=1500):
    """Связные куски маски: панель на чертеже разрезана линиями на несколько частей."""
    from collections import deque
    seen = np.zeros(m.shape, bool)
    H, W = m.shape
    out = []
    for y in range(H):
        for x in range(W):
            if not m[y, x] or seen[y, x]:
                continue
            q = deque([(y, x)]); seen[y, x] = True; pix = []
            while q:
                cy, cx = q.popleft(); pix.append((cy, cx))
                for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                    ny, nx = cy+dy, cx+dx
                    if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; q.append((ny, nx))
            if len(pix) >= floor:
                one = np.zeros(m.shape, bool)
                for cy, cx in pix:
                    one[cy, cx] = True
                out.append((len(pix), one))
    out.sort(key=lambda t: -t[0])
    return [o for _, o in out]


def fill_holes(m):
    """Дыры внутри силуэта — стёкла и колёса; для внешнего обвода они не нужны."""
    from collections import deque
    H, W = m.shape
    outside = np.zeros((H, W), bool)
    q = deque()
    for x in range(W):
        for y in (0, H - 1):
            if not m[y, x] and not outside[y, x]:
                outside[y, x] = True; q.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if not m[y, x] and not outside[y, x]:
                outside[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y+dy, x+dx
            if 0 <= ny < H and 0 <= nx < W and not m[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True; q.append((ny, nx))
    return ~outside


def path_of_mask(m, to_view, eps=3.2, only_biggest=False):
    chunks = parts(m)
    if only_biggest:
        chunks = chunks[:1]
    subs = []
    for chunk in chunks:
        pts = contour.trace(chunk)
        if len(pts) < 4:
            continue
        v = [to_view(q) for q in contour.rdp(pts, eps)]
        subs.append('M' + ' L'.join(f'{x} {y}' for x, y in v) + ' Z')
        # Дыры внутри куска — колёсная арка, фара, ручка. Без них крыло заливает колесо.
        for hole in parts(fill_holes(chunk) & ~chunk, floor=1000):
            hp = contour.trace(hole)
            if len(hp) < 4:
                continue
            hv = [to_view(q) for q in contour.rdp(hp, eps)]
            subs.append('M' + ' L'.join(f'{x} {y}' for x, y in hv) + ' Z')
    return ' '.join(subs)


def path_of(ids, src, to_view, eps=3.2, only_biggest=False):
    return path_of_mask(mask_of(ids, src), to_view, eps, only_biggest)


out = {}
for name, view in VIEWS.items():
    to_view, ids = fitter(view)
    zones = []
    used = set()
    for code, cell_ids in PANELS[name].items():
        d = path_of(cell_ids, view['src'], to_view)
        if d:
            zones.append({'code': code, 'd': d})
            used.update(cell_ids)
    # Силуэт: маска проекции с залитыми дырами, крупнейший кусок.
    whole = mask_of(ids, view['src'])
    filled = fill_holes(whole)
    silhouette = path_of_mask(filled, to_view, eps=2.6, only_biggest=True)
    # Детали, которым не досталось панели: стёкла, фары, колёса — рисуются линиями.
    detail = [c['id'] for c in cells_in(view['src'])
              if c['id'] not in used and c['area'] > 1100]
    lines = [path_of([i], view['src'], to_view, eps=2.6) for i in detail]
    outline = [silhouette]
    cutouts = [ln for ln in lines if ln]
    out[name] = {'zones': zones, 'outline': outline, 'cutouts': cutouts}

json.dump(out, open(SP + '/paths.json', 'w'), ensure_ascii=False)
for name, v in out.items():
    print(name, 'зон', len(v['zones']), 'деталей', len(v['cutouts']))
