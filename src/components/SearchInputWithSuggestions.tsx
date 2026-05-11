import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
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
  const [open, setOpen] = useState(false)
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
    const groups: Record<string, { icon?: string; suggestions: SearchSuggestion[] }> = {}
    for (const s of suggestions) {
      const groupName = s.group || suggestionKindLabel(s.kind)
      if (!groups[groupName]) {
        groups[groupName] = { icon: s.groupIcon, suggestions: [] }
      }
      groups[groupName].suggestions.push(s)
    }
    return groups
  }, [suggestions])

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
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-lg border border-ally-border bg-ally-bg/95 p-1 shadow-2xl backdrop-blur-md animate-ally-dropdown-in"
          style={{ zIndex: listZIndex }}
        >
          {Object.entries(groupedSuggestions).map(([groupName, { icon, suggestions: groupItems }]) => (
            <div key={groupName} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-ally-accent">
                {icon && <span>{icon}</span>}
                <span>{groupName}</span>
                <div className="h-px flex-1 bg-ally-accent/20" />
              </div>
              <ul role="listbox">
                {groupItems.map((s) => (
                  <li key={`${s.kind}:${s.id}:${s.label}`} role="option">
                    <button
                      type="button"
                      className="group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-ally-accent/10"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(s)}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-ally-card text-xs group-hover:bg-ally-accent group-hover:text-black transition-colors">
                        {icon || '•'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-white group-hover:text-ally-accent">
                          {s.label}
                        </span>
                        {s.group && (
                          <span className="text-[9px] uppercase tracking-tighter text-ally-muted group-hover:text-ally-accent/70">
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
