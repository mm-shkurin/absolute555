"""Контур маски: обход по Муру, упрощение Рамера-Дугласа-Пекера."""
import numpy as np

NB = [(0,1),(1,1),(1,0),(1,-1),(0,-1),(-1,-1),(-1,0),(-1,1)]

def trace(mask):
    """Внешний контур крупнейшей компоненты маски, в пикселях (x, y)."""
    ys, xs = np.nonzero(mask)
    if len(ys) == 0:
        return []
    H, W = mask.shape
    pad = np.zeros((H+2, W+2), bool); pad[1:-1, 1:-1] = mask
    start = None
    for y in range(H+2):
        row = np.nonzero(pad[y])[0]
        if len(row):
            start = (y, int(row[0])); break
    contour = [start]
    b = start; prev = (start[0], start[1]-1)
    while True:
        idx = NB.index((prev[0]-b[0], prev[1]-b[1]))
        found = None
        for k in range(1, 9):
            d = NB[(idx + k) % 8]
            c = (b[0]+d[0], b[1]+d[1])
            if 0 <= c[0] < H+2 and 0 <= c[1] < W+2 and pad[c]:
                found = c; prev = (b[0]+NB[(idx + k - 1) % 8][0], b[1]+NB[(idx + k - 1) % 8][1]); break
        if found is None:
            break
        b = found
        if b == start and len(contour) > 2:
            break
        contour.append(b)
        if len(contour) > 40000:
            break
    return [(x-1, y-1) for y, x in contour]

def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float)
    ab = b - a
    n = np.hypot(*ab)
    P = np.array(pts, float)
    if n == 0:
        d = np.hypot(*(P - a).T)
    else:
        d = np.abs(np.cross(ab, P - a)) / n
    i = int(np.argmax(d))
    if d[i] > eps:
        return rdp(pts[:i+1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]
