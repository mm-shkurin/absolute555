import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const NEWLINE = String.fromCharCode(10)

// Читаем через `loadEnv`, а не `process.env`: Vite отдаёт `.env` клиентскому коду как
// `import.meta.env` и никогда не копирует его в `process.env`. Конфиг, читающий
// `process.env.VITE_API_PROXY_TARGET`, видел бы переменную только когда её экспортировала
// оболочка — то есть у автора и ни у кого больше.
//
// Префикс '' грузит все ключи, не только `VITE_`: `FRONTEND_PORT` объявлен в `.env.example`
// и клиентской переменной не является. Настоящая переменная оболочки всё равно перебивает файл.
function environment(mode: string): Record<string, string> {
  return { ...loadEnv(mode, process.cwd(), ''), ...process.env } as Record<string, string>
}

// Этот запуск вообще будет отдавать приложение браузеру, то есть важен ли прокси?
// `command` равен 'serve' и для `vite dev`, и для `vitest`, который грузит этот же конфиг;
// тесты до прокси не доходят, и требовать переменную там — уронить прогон из-за значения,
// которое он не использует.
function servesBrowser(command: string, mode: string, env: Record<string, string>): boolean {
  // В режиме фикстур (`npm run dev:mock`) прокси не нужен: запросы перехватываются в
  // браузере и до сервера не доходят. Требовать адрес бэкенда там значило бы требовать
  // бэкенд ровно у того запуска, который затеян ради его отсутствия.
  return command === 'serve' && !env.VITEST && !isMock(mode)
}

// Признак режима — сам `--mode mock`, а не переменная в `.env.mock`: файлы `.env.*`
// не хранятся в репозитории, и прогон в CI остался бы без фикстур, молча пытаясь
// достучаться до бэкенда, которого там нет.
function isMock(mode: string): boolean {
  return mode === 'mock'
}

function requireProxyTarget(env: Record<string, string>): string {
  const target = env.VITE_API_PROXY_TARGET
  if (target) return target
  throw new Error(
    [
      'VITE_API_PROXY_TARGET не задан. Дев-сервер проксирует /api на бэкенд,',
      'а адрес свой у каждой копии репозитория.',
      '  1. cp .env.example .env',
      '  2. впишите адрес бэкенда, например',
      '     VITE_API_PROXY_TARGET=http://localhost:8000',
      '     Порт бэкенда: grep BACKEND_PORT ../infra/.env',
    ].join(NEWLINE),
  )
}

export default defineConfig(({ command, mode }) => {
  const env = environment(mode)
  return {
    plugins: [react()],
    // Флаг живёт в сборке, а не в окружении: код проверяет `import.meta.env.VITE_MOCK`,
    // и в обычной сборке эта ветка вырезается целиком вместе с папкой `src/dev`.
    define: isMock(mode) ? { 'import.meta.env.VITE_MOCK': JSON.stringify('1') } : {},
    css: {
      modules: {
        // Имена классов читаемы в девтулзах и хешируются в проде: через полсотни таблиц
        // повторяющиеся имена файлов стоят заметного куска блокирующего рендер CSS.
        generateScopedName:
          command === 'build' ? '[hash:base64:6]' : '[name]__[local]__[hash:base64:4]',
      },
    },
    // Тот же порт и адрес, что у дев-сервера: сценарии знают одно место.
    preview: {
      host: '127.0.0.1',
      port: Number(env.FRONTEND_PORT) || 5173,
      strictPort: true,
    },
    server: {
      host: '127.0.0.1',
      port: Number(env.FRONTEND_PORT) || 5173,
      strictPort: true,
      // В браузерном прогоне живая перезагрузка выключена. Дело не в удобстве: сокет HMR
      // рвётся, когда Selenium закрывает браузер после файла сценариев, необработанный
      // ECONNRESET валит весь дев-сервер, и остальные файлы падают подряд с отказом
      // соединения, не сказав ни слова о причине.
      hmr: env.E2E === '1' ? false : undefined,
      // В режиме фикстур прокси не регистрируется вовсе. Раньше он заводился с пустым
      // адресом, и это было хуже, чем отсутствие: обычные запросы перехватываются в
      // браузере и до него не доходят, а поток событий и веб-сокет — нет. Они упирались
      // в прокси без адреса, тот бросал необработанный ECONNRESET, и весь дев-сервер
      // умирал посреди браузерного прогона.
      proxy: servesBrowser(command, mode, env)
        ? {
            '/api': {
              // Дефолта нет намеренно. Порт бэкенда свой у каждой копии; дефолт был бы
              // неверен для всех, кроме автора, и неверен тихо — сервер бы поднялся,
              // приложение загрузилось, а запросы уходили бы туда, что ещё держит порт.
              target: requireProxyTarget(env),
              changeOrigin: true,
            },
          }
        : undefined,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      // Пин, чтобы даты в тестах не зависели от зоны раннера. Москва, а не UTC: под UTC
      // локальный и UTC-год совпадают по построению, и случай «31 декабря вечером» написать
      // нельзя. В России DST нет с 2014 года, так что смещение — константа.
      env: { TZ: 'Europe/Moscow' },
      testTimeout: 10000,
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        exclude: ['src/main.tsx', 'src/test/**', '**/*.d.ts', '**/__tests__/**'],
      },
    },
  }
})
