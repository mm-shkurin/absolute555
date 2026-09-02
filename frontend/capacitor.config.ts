import type { CapacitorConfig } from '@capacitor/cli'

// Android-обёртка берёт готовую сборку Vite. `webDir` — единственное, что связывает её с
// фронтендом: до перехода здесь стоял `build` от CRA, и с ним обёртка молча упаковала бы
// пустой каталог — приложение собралось бы и показало белый экран.
const config: CapacitorConfig = {
  appId: 'ru.absolut555.app',
  appName: 'Абсолют',
  webDir: 'dist',
}

export default config
