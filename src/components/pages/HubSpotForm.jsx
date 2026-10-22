import { useEffect, useRef, useState } from 'react'
import './pages.css'

// CLONE_SPEC_PAGES §2.2 / §3: native replica of the HubSpot embedded forms
// (portal 246368856, region na2; enterprise form f1df7d97-…, team-plan form a7817add-…).
//
// NOTE: this form intentionally does NOT post to HubSpot or any other endpoint. It only replicates
// the look and the client-side validation states; a valid submit swaps in the original's
// post-submit message locally. Nothing leaves the browser.
//
// Behaviour measured live inside the original iframe (without ever submitting a valid form):
// - a required field is validated on blur ("Please complete this required field."), a malformed
//   email on blur shows "Email must be formatted correctly.";
// - Submit with invalid fields shows the error under EVERY invalid field plus a form-level
//   "Please complete all required fields." above the button (focus stays on the button);
// - inputs: hover shadow 2px, focus 3px, active 4px (#959494), transition box-shadow .2s;
// - Submit: hover translateY(-1px), active translateY(1px), bg unchanged;
// - Company size: custom listbox, 10px below the input, with an auto-focused "Search" box; options
//   41px tall, hover / keyboard focus / selected = filter brightness(90%); "No matches found".
// - Layout: rows are a 30px-gap grid; when the form is ≤430px wide (HubSpot's media query on the
//   iframe width, done here with a container query) rows stack with 20px gaps and Submit is full width.

const COMPANY_SIZES = ['1-10', '11-50', '51-100', '101-500', '500+']
const REQUIRED_MSG = 'Please complete this required field.'
const EMAIL_MSG = 'Email must be formatted correctly.'
const FORM_MSG = 'Please complete all required fields.'

const ROWS = [
  [
    { name: '0-1/firstname', label: 'First name', autoComplete: 'given-name' },
    { name: '0-1/lastname', label: 'Last name', autoComplete: 'family-name' },
  ],
  [{ name: '0-1/jobtitle', label: 'Job title' }],
  [{ name: '0-1/email', label: 'Company email', type: 'email', autoComplete: 'email' }],
  [{ name: '0-2/name', label: 'Company name' }],
  [{ name: '0-2/company_size', label: 'Company size', select: true }],
]
const FIELDS = ROWS.flat()

// Theme fonts: enterprise renders Geist (served by HubSpot, local woff2); team-plan's theme font is
// 'andale mono', times. Line-height is `normal` everywhere, so input / textarea / button heights
// follow the font (43/64/45 with Geist, 40/58/42 with Andale Mono).
const THEMES = {
  enterprise: 'font-hs-geist',
  'team-plan': 'font-hs-andale',
}

function validate(name, value) {
  const v = (value ?? '').trim()
  if (name === '0-2/message') return null
  if (!v) return REQUIRED_MSG
  if (name === '0-1/email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return EMAIL_MSG
  return null
}

const INPUT =
  'hs-input block w-full rounded-[3px] border border-solid border-hubspot-border bg-white p-[10px] text-base leading-[normal] text-hubspot-label outline-none placeholder:text-hubspot-placeholder'

function Label({ htmlFor, id, children, required = true }) {
  return (
    <label htmlFor={htmlFor} id={id} className="mb-[10px] block text-base leading-[normal] text-hubspot-label">
      <span>{children}</span>
      {required && <span className="text-hubspot-error">*</span>}
    </label>
  )
}

function ErrorAlert({ id, children, className = '' }) {
  return (
    <div id={id} role="alert" className={`text-base leading-[normal] text-hubspot-error ${className}`}>
      <span className="sr-only">Error: </span>
      {children}
    </div>
  )
}

function Dropdown({ id, name, labelId, value, invalid, describedBy, onSelect }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)
  const listId = `${id}-listbox`

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toggle = () => {
    setQuery('')
    setOpen((o) => !o)
  }
  const choose = (opt) => {
    onSelect(opt)
    setOpen(false)
    triggerRef.current?.focus()
  }
  const options = COMPANY_SIZES.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
  const focusOption = (i) => {
    const items = listRef.current?.querySelectorAll('[data-option]')
    if (!items?.length) return
    items[Math.max(0, Math.min(items.length - 1, i))].focus()
  }
  const onPanelKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    const items = [...(listRef.current?.querySelectorAll('[data-option]') ?? [])]
    const idx = items.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusOption(idx + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (idx <= 0) searchRef.current?.focus()
      else focusOption(idx - 1)
    } else if (e.key === 'Enter' && idx >= 0) {
      e.preventDefault()
      choose(items[idx].dataset.option)
    }
  }

  return (
    <div ref={wrapRef} className="relative flex items-center" onKeyDown={open ? onPanelKey : undefined}>
      <input type="hidden" name={name} value={value ?? ''} />
      <input
        ref={triggerRef}
        id={id}
        type="text"
        readOnly
        autoComplete="off"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-required="true"
        aria-invalid={invalid ? 'true' : 'false'}
        aria-describedby={describedBy}
        value={value ?? ''}
        onClick={toggle}
        onKeyDown={(e) => {
          if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
            e.preventDefault()
            toggle()
          }
        }}
        className={`${INPUT} cursor-pointer`}
      />
      <div
        aria-hidden="true"
        onClick={toggle}
        className="absolute inset-y-0 right-0 flex cursor-pointer items-center justify-center px-5"
      >
        <span className="hs-caret inline-block align-middle" />
      </div>
      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-[10000] box-border flex max-h-[224px] w-full flex-col overflow-hidden rounded-[3px] border border-solid border-hubspot-border bg-white p-0">
          <div className="flex-none p-[10px]">
            <input
              ref={searchRef}
              type="text"
              role="searchbox"
              placeholder="Search"
              aria-controls={listId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={INPUT}
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="m-0 flex-1 overflow-y-auto p-0">
            {options.length ? (
              options.map((o) => (
                <li
                  key={o}
                  role="option"
                  tabIndex={-1}
                  data-option={o}
                  aria-selected={value === o}
                  onClick={() => choose(o)}
                  className={`hs-option ${value === o ? 'hs-option--selected' : ''}`}
                >
                  {o}
                </li>
              ))
            ) : (
              <li role="option" className="hs-option hs-option--disabled">
                No matches found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function HubSpotForm({ variant = 'enterprise', formId, className = '' }) {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const font = THEMES[variant]
  const uid = `hs-${variant}`
  const id = (name) => `${uid}-${name.replace('/', '-')}`

  const setField = (name, value) => {
    setValues((s) => ({ ...s, [name]: value }))
    // A shown error clears as soon as the field becomes valid.
    if (errors[name] && !validate(name, value)) setErrors((s) => ({ ...s, [name]: null }))
  }
  const blurField = (name) => (e) => setErrors((s) => ({ ...s, [name]: validate(name, e.target.value) }))

  const onSubmit = (e) => {
    e.preventDefault()
    const next = {}
    for (const f of FIELDS) next[f.name] = validate(f.name, values[f.name])
    setErrors(next)
    const invalid = Object.values(next).some(Boolean)
    setFormError(invalid)
    if (!invalid) setSubmitted(true) // local only, see NOTE above
  }

  if (submitted) {
    // Post-submit content from the form definition (not captured live; typography beyond
    // "30px bold, line-height 125%" is unspecified).
    return (
      <div className={`hs-form-frame ${className}`} data-form-id={formId}>
        <div className={`p-10 text-hubspot-label ${font}`}>
          <p className="text-[30px] font-bold leading-[1.25]">Form submitted</p>
          <p className="text-base leading-[normal]">Thank you, we'll be in touch soon.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`hs-form-frame ${className}`} data-form-id={formId}>
      <form noValidate onSubmit={onSubmit} className={`p-10 text-base leading-[normal] text-black ${font}`}>
        {ROWS.map((row) => (
          <div key={row[0].name} className="hs-row">
            {row.map((f) => {
              const fid = id(f.name)
              const err = errors[f.name]
              return (
                <div key={f.name}>
                  <Label htmlFor={fid} id={`${fid}-label`}>
                    {f.label}
                  </Label>
                  {f.select ? (
                    <Dropdown
                      id={fid}
                      name={f.name}
                      labelId={`${fid}-label`}
                      value={values[f.name]}
                      invalid={!!err}
                      describedBy={err ? `${fid}-err` : undefined}
                      onSelect={(v) => setField(f.name, v)}
                    />
                  ) : (
                    <input
                      id={fid}
                      name={f.name}
                      type={f.type ?? 'text'}
                      autoComplete={f.autoComplete}
                      value={values[f.name] ?? ''}
                      onChange={(e) => setField(f.name, e.target.value)}
                      onBlur={blurField(f.name)}
                      aria-required="true"
                      aria-invalid={err ? 'true' : 'false'}
                      aria-describedby={err ? `${fid}-err` : undefined}
                      className={INPUT}
                    />
                  )}
                  {err && (
                    <ErrorAlert id={`${fid}-err`} className="mt-[10px]">
                      {err}
                    </ErrorAlert>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        <div className="hs-row">
          {/* Optional message: label is a rich-text span, 14px #2c2826 on #fff (line-height normal).
              The textarea is inline-block in HubSpot, leaving a 4px descender gap below it. */}
          <div className="pb-1">
            <label htmlFor={id('0-2/message')} className="mb-[10px] block text-base leading-[normal] text-hubspot-label">
              <span className="bg-white text-sm leading-[normal] text-foreground">Anything else you'd like to share?</span>
            </label>
            <textarea
              id={id('0-2/message')}
              name="0-2/message"
              rows={2}
              value={values['0-2/message'] ?? ''}
              onChange={(e) => setField('0-2/message', e.target.value)}
              className={`${INPUT} align-top`}
            />
          </div>
        </div>
        <div className="mt-10">
          {formError && <ErrorAlert className="mb-5">{FORM_MSG}</ErrorAlert>}
          <div className="hs-buttons">
            {/* Submit: black, 16px bold, padding 12/24, radius 3; hover lifts 1px, active presses 1px. */}
            <button
              type="submit"
              className="hs-submit cursor-pointer rounded-[3px] bg-hubspot-submit px-6 py-3 text-base font-bold leading-[normal] text-white"
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
