// Карта замеров одного объявления. Отдельный запрос от карточки: у каждой панели снимок
// экрана прибора, и тянуть их в ленту незачем — карточка несёт только сводку.
//
// Собственной формы провода у фичи нет: она берёт контракт истории 14 как есть.
export {
  deleteMeasurement,
  fetchThicknessMap,
  putMeasurement,
} from '../../../shared/api/backend/thicknessApi'
export type {
  BodyPanel,
  PanelStatus,
  ThicknessMapWire,
  ThicknessMeasurementWire,
} from '../../../shared/api/backend/thicknessContract'
