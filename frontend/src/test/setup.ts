import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Размонтирование после каждого теста. Без него второй тест находит два экземпляра одного
// элемента и падает на getByRole с сообщением, которое не про его причину.
afterEach(() => {
  cleanup()
})
