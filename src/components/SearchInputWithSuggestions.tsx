import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
import { X } from 'lucide-react'
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
  /** Forwarded to the underlying text input (e.g. Ctrl+K focus). */
  inputRef?: Ref<HTMLInputElement>
  /** When true, show `prependSuggestions` while the query is empty (e.g. recent searches). */
  prependWhenEmpty?: boolean
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
  inputRef,
  prependWhenEmpty = false,
  ...inputProps
}: SearchInputWithSuggestionsProps) {
  const componentId = useId()
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const suggestions = useMemo(() => {
    if (!enableSuggestions) return []
    const n = normalizeSearchText(value)
    const nk = n.replace(/[^a-z0-9]/g, '')
    const empty = n.length === 0 && nk.length === 0
    if (prependWhenEmpty && empty && prependSuggestions.length > 0) {
      return prependSuggestions.slice(0, maxSuggestions)
    }
    if (n.length < minQueryLength && nk.length < minQueryLength) return []
    const base = filterSearchSuggestions(value, kinds, maxSuggestions)
    const prep = prependSuggestions.filter((s) => labelMatchesQuery(s.label, value))
    const seen = new Set(prep.map((s) => `${s.kind}:${s.label}`))
    const rest = base.filter((s) => !seen.has(`${s.kind}:${s.label}`))
    return [...prep, ...rest].slice(0, maxSuggestions)
  }, [
    value,
    kinds,
    maxSuggestions,
    minQueryLength,
    prependSuggestions,
    enableSuggestions,
    prependWhenEmpty,
  ])

  const groupedSuggestions = useMemo(() => {
    const groups: Record<
      string,
      { icon?: string; suggestions: (SearchSuggestion & { globalIndex: number })[] }
    > = {}
    suggestions.forEach((s, globalIndex) => {
      const groupName = s.group || suggestionKindLabel(s.kind)
      if (!groups[groupName]) {
        groups[groupName] = { icon: s.groupIcon, suggestions: [] }
      }
      groups[groupName].suggestions.push({ ...s, globalIndex })
    })
    return groups
  }, [suggestions])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [suggestions, open])

  useEffect(() => {
    if (highlightedIndex >= 0 && open) {
      const el = document.getElementById(`${componentId}-suggestion-${highlightedIndex}`)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'auto' })
      }
    }
  }, [highlightedIndex, open, componentId])

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
        ref={inputRef}
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
          if (e.key === 'Escape') {
            if (showList) {
              setOpen(false)
              e.preventDefault()
              e.stopPropagation()
            } else if (value) {
              onChange('')
              e.preventDefault()
              e.stopPropagation()
            }
          } else if (e.key === 'ArrowDown') {
            if (!showList) {
              setOpen(true)
            } else {
              setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
            }
            e.preventDefault()
          } else if (e.key === 'ArrowUp') {
            if (showList) {
              setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
            }
            e.preventDefault()
          } else if (e.key === 'Enter') {
            if (showList && highlightedIndex >= 0) {
              pick(suggestions[highlightedIndex])
              e.preventDefault()
            }
          }
          inputProps.onKeyDown?.(e)
        }}
        className={`${inputClassName} ${value ? 'pr-9' : ''}`}
        style={inputStyle}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={`${componentId}-suggestions-list`}
        aria-activedescendant={
          highlightedIndex >= 0 ? `${componentId}-suggestion-${highlightedIndex}` : undefined
        }
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ally-muted hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {showList && (
        <div
          id={`${componentId}-suggestions-list`}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-lg border border-ally-border bg-ally-bg/95 p-1 shadow-2xl backdrop-blur-md animate-ally-dropdown-in"
          style={{ zIndex: listZIndex }}
          role="listbox"
        >
          {Object.entries(groupedSuggestions).map(([groupName, { icon, suggestions: groupItems }]) => (
            <div key={groupName} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-ally-accent">
                {icon && <span>{icon}</span>}
                <span>{groupName}</span>
                <div className="h-px flex-1 bg-ally-accent/20" />
              </div>
              <ul>
                {groupItems.map((s) => (
                  <li
                    key={`${s.kind}:${s.id}:${s.label}`}
                    id={`${componentId}-suggestion-${s.globalIndex}`}
                    role="option"
                    aria-selected={s.globalIndex === highlightedIndex}
                  >
                    <button
                      type="button"
                      className={`group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                        s.globalIndex === highlightedIndex
                          ? 'bg-ally-accent/20'
                          : 'hover:bg-ally-accent/10'
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(s)}
                      onMouseEnter={() => setHighlightedIndex(s.globalIndex)}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded bg-ally-card text-xs transition-colors ${
                          s.globalIndex === highlightedIndex
                            ? 'bg-ally-accent text-black'
                            : 'group-hover:bg-ally-accent group-hover:text-black'
                        }`}
                      >
                        {icon || '•'}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-[13px] font-medium transition-colors ${
                            s.globalIndex === highlightedIndex
                              ? 'text-ally-accent'
                              : 'text-white group-hover:text-ally-accent'
                          }`}
                        >
                          {s.label}
                        </span>
                        {s.group && (
                          <span
                            className={`text-[9px] uppercase tracking-tighter transition-colors ${
                              s.globalIndex === highlightedIndex
                                ? 'text-ally-accent/70'
                                : 'text-ally-muted group-hover:text-ally-accent/70'
                            }`}
                          >
                            {suggestionKindLabel(s.kind)}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
