import { useMemo, useRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react'
import type { SearchSuggestion, SearchSuggestionKind } from '@/utils/searchSuggestions'
import {
  filterSearchSuggestions,
  labelMatchesQuery,
  normalizeSearchText,
  suggestionKindLabel,
} from '@/utils/searchSuggestions'

export type { SearchSuggestion, SearchSuggestionKind }

export interface SearchInputWithSuggestionsProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'placeholder'> {
  value: string
  onChange: (value: string) => void
  placeholder: string
  kinds: SearchSuggestionKind[] | 'all'
  minQueryLength?: number
  maxSuggestions?: number
  prependSuggestions?: SearchSuggestion[]
  onSuggestionPick?: (s: SearchSuggestion) => void
  leftSlot?: ReactNode
  enableSuggestions?: boolean
  wrapperClassName?: string
  inputClassName?: string
  inputStyle?: CSSProperties
  listZIndex?: number
}

export function SearchInputWithSuggestions({
  value,
  onChange,
  placeholder,
  kinds,
  minQueryLength = 2,
  maxSuggestions = 8,
  prependSuggestions = [],
  onSuggestionPick,
  leftSlot,
  enableSuggestions = true,
  wrapperClassName = '',
  inputClassName = '',
  inputStyle,
  listZIndex = 50,
  ...inputProps
}: SearchInputWithSuggestionsProps) {
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const suggestions = useMemo(() => {
    if (!enableSuggestions) return []
    const n = normalizeSearchText(value)
    const nk = n.replace(/[^a-z0-9]/g, '')
    if (n.length < minQueryLength && nk.length < minQueryLength) return []
    const base = filterSearchSuggestions(value, kinds, maxSuggestions)
    const prep = prependSuggestions.filter((s) => labelMatchesQuery(s.label, value))
    const seen = new Set(prep.map((s) => `${s.kind}:${s.label}`))
    const rest = base.filter((s) => !seen.has(`${s.kind}:${s.label}`))
    return [...prep, ...rest].slice(0, maxSuggestions)
  }, [value, kinds, maxSuggestions, minQueryLength, prependSuggestions, enableSuggestions])

  const showList = open && suggestions.length > 0

  const pick = (s: SearchSuggestion) => {
    onChange(s.label)
    onSuggestionPick?.(s)
    setOpen(false)
  }

  const cancelBlur = () => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      {leftSlot}
      <input
        {...inputProps}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          cancelBlur()
          setOpen(true)
          inputProps.onFocus?.(e)
        }}
        onBlur={(e) => {
          blurTimer.current = setTimeout(() => setOpen(false), 120)
          inputProps.onBlur?.(e)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          inputProps.onKeyDown?.(e)
        }}
        className={inputClassName}
        style={inputStyle}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
      />
      {showList && (
        <ul
          className="absolute left-0 right-0 top-full mt-0.5 max-h-56 overflow-y-auto rounded-md border border-[#2a2a2a] bg-[#141414] py-1 shadow-lg"
          style={{ zIndex: listZIndex }}
          role="listbox"
        >
          {suggestions.map((s) => (
            <li key={`${s.kind}:${s.id}:${s.label}`} role="option">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] text-white hover:bg-[#1f1f1f]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <span className="shrink-0 rounded bg-[#252525] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#a1a1a1]">
                  {suggestionKindLabel(s.kind)}
                </span>
                <span className="min-w-0 truncate">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
