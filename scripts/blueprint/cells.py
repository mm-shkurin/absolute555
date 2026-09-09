"""Ячейки чертежа по векторному растру: линии делят лист на замкнутые области."""
import json, sys
from collections import deque
import numpy as np

SP = sys.argv[1]
ink = np.load(SP + '/ink.npy')
free = ~ink
H, W = ink.shape
label = np.zeros((H, W), np.int32)

q = deque()
for x in range(W):
    for y in (0, H - 1):
        if free[y, x] and label[y, x] == 0:
            label[y, x] = -1; q.append((y, x))
for y in range(H):
    for x in (0, W - 1):
        if free[y, x] and label[y, x] == 0:
            label[y, x] = -1; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny, nx = y+dy, x+dx
        if 0 <= ny < H and 0 <= nx < W and free[ny, nx] and label[ny, nx] == 0:
            label[ny, nx] = -1; q.append((ny, nx))

cells, cur = [], 0
for y0 in range(H):
    row = np.nonzero(free[y0] & (label[y0] == 0))[0]
    for x0 in row:
        if label[y0, x0] != 0:
            continue
        cur += 1
        pix = []
        label[y0, x0] = cur; q.append((y0, int(x0)))
        while q:
            y, x = q.popleft(); pix.append((y, x))
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny, nx = y+dy, x+dx
                if 0 <= ny < H and 0 <= nx < W and free[ny, nx] and label[ny, nx] == 0:
                    label[ny, nx] = cur; q.append((ny, nx))
        if len(pix) < 500:
            continue
        ys = [p[0] for p in pix]; xs = [p[1] for p in pix]
        cells.append({'id': cur, 'area': len(pix),
                      'bbox': [min(xs), min(ys), max(xs), max(ys)],
                      'cx': round(sum(xs)/len(xs), 1), 'cy': round(sum(ys)/len(ys), 1)})

np.save(SP + '/labels.npy', label)
json.dump(cells, open(SP + '/cells.json', 'w'), ensure_ascii=False)
print('ячеек', len(cells))
