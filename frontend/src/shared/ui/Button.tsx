// Кнопка и кнопка-ссылка в одном модуле: у них одна внешность и разная семантика.
// Переход навигацией должен оставаться ссылкой — иначе средняя кнопка мыши, «открыть в новой
// вкладке» и чтение с клавиатуры теряются, а внешне подмена незаметна.
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Button.module.css'

export type ButtonTone = 'solid' | 'ghost'
export type ButtonSize = 'regular' | 'big' | 'small'

interface Look {
  tone?: ButtonTone
  size?: ButtonSize
  block?: boolean
  className?: string
}

export function buttonClass({ tone = 'solid', size = 'regular', block, className }: Look): string {
  return [
    styles.button,
    tone === 'ghost' ? styles.ghost : '',
    size === 'big' ? styles.big : '',
    size === 'small' ? styles.small : '',
    block ? styles.block : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

type ButtonProps = Look & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ tone, size, block, className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={buttonClass({ tone, size, block, className })} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  tone,
  size,
  block,
  className,
  children,
  ...rest
}: Look & { to: string; children: ReactNode; 'data-testid'?: string }) {
  return (
    <Link to={to} className={buttonClass({ tone, size, block, className })} {...rest}>
      {children}
    </Link>
  )
}
