import { cn } from '@/lib'

interface TechListProps extends Omit<React.ComponentProps<'ul'>, 'children'> {
	/** Technology or tool names, one per item. Each name is also its key, so keep them unique. */
	items: string[]
	/** Text size, color and spacing for every item. There is deliberately no default size: each caller sets its own. */
	itemClassName?: string
}

/**
 * Wrapping row of monospace technology names (pass grid classes for aligned columns); a name never breaks across lines.
 * No 'use client': it renders on the server unless a Client Component imports it.
 */
export default function TechList({ items, className, itemClassName, ...props }: TechListProps) {
	// Tailwind's preflight already removes list margin, padding and bullets.
	// role="list" keeps list semantics in Safari, which drops them from list-style: none lists
	return (
		<ul role="list" className={cn('flex flex-wrap', className)} {...props}>
			{items.map((item) => (
				<li key={item} className={cn('font-mono whitespace-nowrap', itemClassName)}>
					{item}
				</li>
			))}
		</ul>
	)
}
