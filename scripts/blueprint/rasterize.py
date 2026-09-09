"""Растеризация Vector.svg своими силами: путь из M/L/C/Z, заливка по evenodd."""
import re, sys
import numpy as np
from PIL import Image, ImageDraw

SRC, SP = sys.argv[1], sys.argv[2]
SCALE = float(sys.argv[3]) if len(sys.argv) > 3 else 3.0
d = re.search(r'\sd="([^"]+)"', open(SRC, encoding='utf-8').read()).group(1)

num = r'-?\d*\.?\d+(?:e-?\d+)?'
tokens = re.findall(rf'([MLCZ])|({num})', d)


def numbers(it, n):
    out = []
    while len(out) < n:
        kind, val = next(it)
        out.append(float(val))
    return out


def bezier(p0, p1, p2, p3, steps=14):
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        yield (u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
               u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1])


subpaths, cur = [], []
it = iter(tokens)
pos = (0.0, 0.0)
while True:
    try:
        kind, val = next(it)
    except StopIteration:
        break
    if kind == 'M':
        if len(cur) > 2:
            subpaths.append(cur)
        x, y = numbers(it, 2)
        pos = (x, y)
        cur = [pos]
    elif kind == 'L':
        x, y = numbers(it, 2)
        pos = (x, y)
        cur.append(pos)
    elif kind == 'C':
        x1, y1, x2, y2, x3, y3 = numbers(it, 6)
        cur.extend(bezier(pos, (x1, y1), (x2, y2), (x3, y3)))
        pos = (x3, y3)
    elif kind == 'Z':
        if len(cur) > 2:
            subpaths.append(cur)
        cur = []
if len(cur) > 2:
    subpaths.append(cur)

W, H = int(1212 * SCALE), int(760 * SCALE)
acc = np.zeros((H, W), bool)
for sp in subpaths:
    img = Image.new('1', (W, H), 0)
    ImageDraw.Draw(img).polygon([(x * SCALE, y * SCALE) for x, y in sp], fill=1)
    acc ^= np.asarray(img, bool)

np.save(SP + '/ink.npy', acc)
Image.fromarray((~acc * 255).astype(np.uint8)).save(SP + '/vector.png')
ys, xs = np.nonzero(acc)
print('подпутей', len(subpaths), 'растр', W, H, 'чернила', xs.min(), ys.min(), xs.max(), ys.max())
