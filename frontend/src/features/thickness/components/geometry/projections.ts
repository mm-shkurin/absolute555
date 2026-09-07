// Порядок проекций — порядок обхода машины: левый борт, перёд, крыша, зад, правый борт.
import type { Projection } from './types'
import { LEFT_SIDE, RIGHT_SIDE } from './sides'
import { FRONT, REAR } from './ends'
import { TOP } from './top'

export const VIEW_BOX = '0 0 1000 760'

export const PROJECTIONS: Projection[] = [LEFT_SIDE, FRONT, TOP, REAR, RIGHT_SIDE]
