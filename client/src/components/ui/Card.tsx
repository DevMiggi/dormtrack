import type { ComponentProps } from 'react'

type CardProps = ComponentProps<'div'> & {
  padded?: boolean // false for cards that hold a table or list edge to edge
}

function Card({ padded = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-white shadow-sm ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    />
  )
}

export default Card
