// Подвал. Реквизиты и телефон площадки — единственное, что в нём есть: юридические
// страницы появятся вместе с оплатой, которой в продукте пока нет.
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer} data-testid="site-footer">
      <span>ООО «Абсолют 555» · Омск, Жукова 65/1</span>
      <a href="tel:+73812515073">515-073</a>
      <span className={styles.spacer} />
      <span>Авторынок Омска</span>
    </footer>
  )
}
