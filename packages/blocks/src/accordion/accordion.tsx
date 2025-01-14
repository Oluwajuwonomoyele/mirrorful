import './accordion.css';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons'
import { faAngleUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import cn from 'classnames'
import { createContext, useState } from 'react'
import React, { useContext, useRef } from 'react'

type TAccordionContext = {
  isExpanded: boolean
  setIsExpanded?: (arg0: boolean) => void
}

export const AccordionContext = createContext<TAccordionContext>({
  isExpanded: false,
  setIsExpanded: () => {
    /* Do nothing */
  },
})

export function Accordion({
  isExpanded,
  onChange,
  children,
  style,
  className,
  ref,
}: {
  isExpanded?: boolean
  onChange?: (arg0: boolean) => void
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
  ref?: React.Ref<HTMLDivElement>
}) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false)

  let providerValue: TAccordionContext = {
    isExpanded: internalIsExpanded,
    setIsExpanded: setInternalIsExpanded,
  }

  if (isExpanded !== undefined) {
    providerValue = {
      isExpanded,
      setIsExpanded: onChange,
    }
  }

  return (
    <AccordionContext.Provider value={providerValue}>
      <div
        className={cn('mirrorful' + '-accordion', className)}
        style={style}
        ref={ref}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

export function AccordionHeader({
  label,
  leftIcon,
  rightIcon,
  hasBorder,
  style,
  ref,
  className,
}: {
  label?: string
  leftIcon?: IconDefinition
  rightIcon?: IconDefinition
  hasBorder?: boolean
  style?: React.CSSProperties
  ref?: React.Ref<HTMLDivElement>
  className?: string
}) {
  const { isExpanded, setIsExpanded } = useContext(AccordionContext)

  return (
    <div
      className={cn(
        'mirrorful' + '-accordion-header',
        {
          ['mirrorful' + '-accordion-header-border']: hasBorder,
          ['mirrorful' + '-accordion-header-expanded']: isExpanded,
        },
        className
      )}
      onClick={() => {
        if (setIsExpanded) {
          setIsExpanded(!isExpanded)
        }
      }}
      style={style}
      ref={ref}
    >
      <div
        className={cn('mirrorful' + '-accordion-header-content')}
      >
        <span>{label}</span>
        {leftIcon && (
          <FontAwesomeIcon
            icon={leftIcon}
            className={cn(
              'mirrorful' + '-accordion-header-left-icon'
            )}
          />
        )}
      </div>
      <div>
        {rightIcon && (
          <FontAwesomeIcon
            icon={rightIcon}
            className={cn(
              'mirrorful' + '-accordion-header-right-icon'
            )}
          />
        )}
        <FontAwesomeIcon
          icon={faAngleUp}
          className={cn(
            'mirrorful' + '-accordion-header-expand-icon'
          )}
        />
      </div>
    </div>
  )
}

export function AccordionBody({
  children,
  style,
  className,
}: {
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  const { isExpanded } = useContext(AccordionContext)
  const internalRef = useRef<HTMLDivElement | null>(null)

  return (
    <div
      ref={internalRef}
      className={cn('mirrorful' + '-accordion-body', className)}
      style={{
        ...style,
        maxHeight: isExpanded ? internalRef?.current?.scrollHeight : 0,
      }}
    >
      {children}
    </div>
  )
}

export function AccordionContent({
  children,
  style,
  className,
}: {
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <div
      className={cn('mirrorful' + '-accordion-content', className)}
      style={style}
    >
      {children}
    </div>
  )
}

export function AccordionFooter({
  label,
  onClick,
  style,
  className,
}: {
  label?: string
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <div
      className={cn('mirrorful' + '-accordion-footer', className)}
      style={style}
    >
      <div
        className={cn('mirrorful' + '-accordion-footer-text')}
        onClick={onClick}
      >
        {label}
      </div>
    </div>
  )
}
