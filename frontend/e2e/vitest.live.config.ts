// Прогон против поднятого стека, а не против фикстур.
//
// Отдельный конфиг, а не флаг: у этих сценариев нет `globalSetup` — статику поднимать не
// надо, приложение уже отдаёт nginx, — и адрес по умолчанию другой. Держать их в общем
// списке значило бы ронять прогон каждый раз, когда стек не поднят, причиной, не имеющей
// отношения к тому, что они проверяют.
//
//   E2E_BASE_URL=http://localhost npx vitest run --config e2e/vitest.live.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['e2e/specs/**/*.live.ts'],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    env: { TZ: 'Europe/Moscow' },
  },
})
