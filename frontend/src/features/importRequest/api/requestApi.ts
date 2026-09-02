// Заявка на привоз и отклики на неё. Отклик — это предложение наоборот: не покупатель
// торгуется за машину, а поставщики за покупателя.
//
// Собственной формы провода у фичи нет: она берёт контракт истории 18 как есть.
export {
  closeRequest,
  fetchMyRequests,
  fetchOpenRequests,
  fetchResponses,
  openRequest,
  putResponse,
} from '../../../shared/api/backend/requestApi'
export type {
  BuyerRequestCreate,
  BuyerRequestWire,
  SupplierResponseCreate,
  SupplierResponseWire,
} from '../../../shared/api/backend/requestContract'
