import json, sys
SP, G = sys.argv[1], sys.argv[2]
p = json.load(open(SP + '/paths.json'))
def arr(n, key): return '\n'.join(f"  '{d}'," for d in p[n][key] if d)
def zones(n): return '\n'.join(f"  {{ code: '{z['code']}', d: '{z['d']}' }}," for z in p[n]['zones'])
HEAD = ("// Обведено с чертежа кузова: линии оригинала разложены на замкнутые области,\n"
        "// каждая панель — объединение своих областей. Фары, фонари, стёкла и колёса\n"
        "// в панели не входят и рисуются поверх: это проёмы, а не окрашиваемый металл.\n"
        "import type { Projection, Zone } from './types'\n")

def block(n, name):
    return f"""const {name}_ZONES: Zone[] = [
{zones(n)}
]

const {name}_OUTLINE: string[] = [
{arr(n, 'outline')}
]

const {name}_CUTOUTS: string[] = [
{arr(n, 'cutouts')}
]
"""

open(G + '/sides.ts', 'w', encoding='utf-8').write(f"""{HEAD}import {{ mirrorCode }} from './types'

{block('side', 'SIDE')}
export const LEFT_SIDE: Projection = {{
  label: 'БОРТ ЛЕВЫЙ',
  labelX: 246,
  labelY: 40,
  zones: SIDE_ZONES,
  outline: SIDE_OUTLINE,
  cutouts: SIDE_CUTOUTS,
  wheels: [],
}}

export const RIGHT_SIDE: Projection = {{
  label: 'БОРТ ПРАВЫЙ',
  labelX: 246,
  labelY: 552,
  zones: SIDE_ZONES.map((zone) => ({{ code: mirrorCode(zone.code), d: zone.d }})),
  outline: SIDE_OUTLINE,
  cutouts: SIDE_CUTOUTS,
  wheels: [],
  transform: 'translate(0,505) scale(-1,1) translate(-1020,0)',
}}
""")

open(G + '/top.ts', 'w', encoding='utf-8').write(f"""{HEAD}
{block('top', 'TOP')}
export const TOP: Projection = {{
  label: 'СВЕРХУ',
  labelX: 246,
  labelY: 285,
  zones: TOP_ZONES,
  outline: TOP_OUTLINE,
  cutouts: TOP_CUTOUTS,
  wheels: [],
}}
""")

open(G + '/ends.ts', 'w', encoding='utf-8').write(f"""{HEAD}// Спереди мы смотрим машине навстречу, и её левый борт оказывается справа на экране.

{block('front', 'FRONT')}
{block('rear', 'REAR')}
export const FRONT: Projection = {{
  label: 'ПЕРЕД',
  labelX: 30,
  labelY: 285,
  zones: FRONT_ZONES,
  outline: FRONT_OUTLINE,
  cutouts: FRONT_CUTOUTS,
  wheels: [],
}}

export const REAR: Projection = {{
  label: 'ЗАД',
  labelX: 806,
  labelY: 285,
  zones: REAR_ZONES,
  outline: REAR_OUTLINE,
  cutouts: REAR_CUTOUTS,
  wheels: [],
}}
""")
print('ok')
