// Отдельный прогон от юнитов: браузерные сценарии идут минутами, а не миллисекундами,
// и держать их в `npm test` значит либо ждать их на каждое сохранение, либо перестать
// запускать оба.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['e2e/specs/**/*.e2e.ts'],
    globalSetup: ['./e2e/serve.ts'],
    // Сценарии ходят по одному браузеру на файл: параллельные файлы подняли бы по Chrome
    // на каждый, и машина разработчика ушла бы в своп.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    env: { TZ: 'Europe/Moscow' },
  },
})
