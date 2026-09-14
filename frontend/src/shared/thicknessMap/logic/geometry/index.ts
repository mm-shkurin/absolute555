// Схема кузова: пять проекций седана в одном поле координат 1000x760.
// Порядок — порядок обхода машины: левый борт, перёд, крыша, зад, правый борт.
import type { Projection } from './types'
import { LEFT_SIDE, RIGHT_SIDE } from './sides'
import { FRONT, REAR } from './ends'
import { TOP } from './top'

export type { Projection, Wheel, Zone } from './types'

export const VIEW_BOX = '0 0 1000 790'

export const PROJECTIONS: Projection[] = [LEFT_SIDE, FRONT, TOP, REAR, RIGHT_SIDE]
