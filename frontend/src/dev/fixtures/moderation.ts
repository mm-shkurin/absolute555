import type {
  ComplaintCaseWire,
  QueueItemWire,
} from '../../features/moderation/api/moderationApi'
import type { RoleRequestListItemWire } from '../../shared/api/backend/accountContract'

const HOURS = 3600_000
const DAYS = 24 * HOURS

const queueBase: QueueItemWire = {
  id: 'q1',
  listing_id: 'l3',
  title: 'Honda Stream',
  year: 2010,
  price: 1020000,
  seller_name: 'Михаил',
  seller_rating: 4.8,
  seller_is_new: false,
  submitted_at: new Date(Date.now() - 3 * HOURS).toISOString(),
  photos_count: 7,
  measured_panels: 11,
  total_panels: 13,
  complaints_count: 0,
  complaint_reason: null,
  is_import: false,
  vin_masked: 'JHMRN18***0231',
  photos_plate_hidden: true,
  phone_hidden: true,
}

export const QUEUE: QueueItemWire[] = [
  queueBase,
  {
    ...queueBase,
    id: 'q2',
    listing_id: 'l5',
    title: 'Kia Rio',
    year: 2018,
    price: 980000,
    seller_name: 'Анна',
    seller_rating: null,
    seller_is_new: true,
    photos_count: 4,
    measured_panels: 0,
    photos_plate_hidden: false,
  },
  {
    ...queueBase,
    id: 'q3',
    listing_id: 'l6',
    title: 'BMW X5',
    year: 2013,
    price: 2450000,
    seller_name: 'Игорь',
    seller_rating: 3.9,
    photos_count: 11,
    complaints_count: 2,
    complaint_reason: 'цена-приманка',
  },
  {
    ...queueBase,
    id: 'q4',
    listing_id: 'i1',
    title: 'Toyota Alphard',
    year: 2021,
    price: 6100000,
    seller_name: 'Восток-Авто',
    is_import: true,
    vin_masked: null,
    measured_panels: 0,
  },
]

export const COMPLAINTS: ComplaintCaseWire[] = [
  {
    listing_id: 'l6',
    title: 'BMW X5',
    year: 2013,
    price: 2450000,
    seller_name: 'Игорь',
    seller_rating: 3.9,
    published_at: new Date(Date.now() - 16 * DAYS).toISOString(),
    complaints: [
      {
        id: 'cm1',
        author_name: 'Артём',
        created_at: new Date(Date.now() - 5 * HOURS).toISOString(),
        reason: 'цена-приманка',
        body: 'В объявлении 2 450 000, а в чате продавец говорит, что реальная цена 2 900 000 и «это была ошибка». Висит так третью неделю.',
      },
      {
        id: 'cm2',
        author_name: 'Ольга',
        created_at: new Date(Date.now() - 28 * HOURS).toISOString(),
        reason: 'фото не той машины',
        body: 'Фотографии из интернета, на трёх снимках разные диски и разный салон.',
      },
    ],
  },
]

export const ROLE_APPLICATIONS: RoleRequestListItemWire[] = [
  {
    id: 'ra1',
    user_id: 'u41',
    user_name: 'Дмитрий Ким',
    requested_role: 'importer',
    reason: 'Вожу с аукционов Японии пятый год, хочу выставлять позиции сам.',
    additional_info:
      'Работаю через партнёра во Владивостоке, растаможку беру на себя. Готов показать документы по прошлым поставкам.',
    status: 'pending',
    created_at: new Date(Date.now() - 4 * DAYS).toISOString(),
    updated_at: null,
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
  },
  {
    id: 'ra2',
    user_id: 'u42',
    // Имени нет: провайдер входа его не отдал.
    user_name: null,
    requested_role: 'importer',
    reason: 'Вожу машины.',
    additional_info: null,
    status: 'pending',
    created_at: new Date(Date.now() - 2 * DAYS).toISOString(),
    updated_at: null,
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
  },
  {
    id: 'ra3',
    user_id: 'u43',
    user_name: 'Ольга Т.',
    requested_role: 'importer',
    reason: 'Возила под заказ на другой площадке.',
    additional_info: null,
    status: 'approved',
    created_at: new Date(Date.now() - 9 * DAYS).toISOString(),
    updated_at: new Date(Date.now() - 8 * DAYS).toISOString(),
    reviewed_by: 'u1',
    reviewed_at: new Date(Date.now() - 8 * DAYS).toISOString(),
    review_comment: null,
  },
]
