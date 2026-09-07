// Настоящий кадр на месте, где раньше стояла штриховка. Принимает тот же класс слота,
// что и Placeholder, поэтому замена не трогает раскладку секции.
import styles from './Shot.module.css'

export function Shot({
  src,
  alt,
  className,
  fit = 'cover',
}: {
  src: string
  alt: string
  className?: string
  fit?: 'cover' | 'contain'
}) {
  const shape = fit === 'contain' ? styles.contain : styles.cover
  return (
    <div className={[styles.shot, shape, className ?? ''].filter(Boolean).join(' ')}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  )
}
