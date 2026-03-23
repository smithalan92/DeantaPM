import { useState, useRef, cloneElement } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

interface Props {
  label: string
  children: React.ReactElement<any>
}

export default function TruncatedTooltip({ label, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)

  function handleMouseEnter(e: React.MouseEvent) {
    children.props.onMouseEnter?.(e)
    const el = ref.current
    if (el && el.scrollWidth > el.clientWidth) setOpen(true)
  }

  function handleMouseLeave(e: React.MouseEvent) {
    children.props.onMouseLeave?.(e)
    setOpen(false)
  }

  return (
    <TooltipPrimitive.Root open={open}>
      <TooltipPrimitive.Trigger asChild>
        {cloneElement(children as React.ReactElement<any>, {
          ref,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        })}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className="animate-tooltip-in z-[200] max-w-[280px] rounded-md border border-white/[0.12] bg-[rgba(20,20,22,0.97)] px-2.5 py-1.5 text-[13px] leading-[1.4] break-words text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-lg"
          sideOffset={6}
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-[rgba(20,20,22,0.97)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
