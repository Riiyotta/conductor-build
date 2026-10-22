/** @type {import('tailwindcss').Config} */
// Design tokens for the conductor.build homepage clone (CLONE_SPEC.md §0).
// Light theme only. Every color / radius / container width used in JSX lives here.
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#2c2826',
        muted: {
          DEFAULT: '#fafaf9',
          foreground: '#756f6c',
        },
        border: '#eae8e6',
        highlight: {
          DEFAULT: '#faf7f5',
          foreground: '#594545',
        },
        positive: '#16a249',
        primary: '#413030',
        'tip-secondary': {
          DEFAULT: '#f8f7f6',
          border: '#f3ece7',
        },
        'tip-muted': '#7d5e59',
        // green-500 in the original (Tailwind v4 palette, computed lab(70.55 -66.51 45.81)) – presence dots
        presence: '#00c950',
        // red-400 / amber-400 / green-400 (Tailwind v4 palette) – faux window traffic lights
        traffic: {
          red: '#ff6467',
          amber: '#ffb900',
          green: '#05df72',
        },
        // Fable / Claude mark in the orchestration demo
        fable: '#D97757',
        // --- CLONE_SPEC_PAGES §0.4 (standalone marketing pages) ---
        secondary: '#fafaf9', // `hover:bg-secondary` (pricing outline button)
        'apply-tile': '#F5F5F5', // join-us apply-card icon tile (literal bg-[#F5F5F5] in the original)
        'brand-dark': '#282423', // brandkit dark preview panels (literal bg-[#282423])
        // HubSpot embedded form (enterprise / team-plan), measured inside the iframe
        hubspot: {
          label: '#212d3a',
          border: '#959494',
          error: '#e51520',
          submit: '#000000',
          placeholder: 'rgba(0,0,0,0.64)',
        },
      },
      borderColor: {
        DEFAULT: '#eae8e6',
      },
      fontFamily: {
        // §0.1: Geist is declared but never applied; this is what actually renders.
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
        // Prose articles (CLONE_SPEC_PAGES §0.3): fumadocs' --product-font-geist-sans stack, as computed on the
        // original. No Geist @font-face is shipped, so this renders the system sans unless Geist is installed
        // locally (in which case the original renders Geist too).
        prose: ['Geist', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // HubSpot form themes (CLONE_SPEC_PAGES §2.2 / §3)
        'hs-geist': ['"HS Geist"', 'Helvetica'],
        'hs-andale': ['"andale mono"', 'times'],
      },
      // Tailwind v4 type scale: same sizes as v3, but line-heights are unitless ratios, so
      // children with arbitrary font sizes inherit proportionally (e.g. the avatar tooltip
      // 10px → 13.33px line-height, §4).
      fontSize: {
        xs: ['0.75rem', { lineHeight: 'calc(1 / 0.75)' }],
        sm: ['0.875rem', { lineHeight: 'calc(1.25 / 0.875)' }],
        base: ['1rem', { lineHeight: '1.5' }],
        xl: ['1.25rem', { lineHeight: 'calc(1.75 / 1.25)' }],
        '2xl': ['1.5rem', { lineHeight: 'calc(2 / 1.5)' }],
        '4xl': ['2.25rem', { lineHeight: 'calc(2.5 / 2.25)' }],
      },
      // §0.3 (Tailwind v4 radius scale; note v4 `rounded-xs` = 2px, `rounded-sm` = 4px)
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        icon: '3px',
      },
      // §0.4 containers
      maxWidth: {
        sm: '384px',
        md: '448px',
        lg: '512px',
        xl: '576px',
        '2xl': '672px',
        '3xl': '768px',
        '6xl': '1152px',
        '7xl': '1280px',
        hero: '1920px',
        // CLONE_SPEC_PAGES §0.1 `.site-container` default --site-content-width
        site: '900px',
        // prose default max-width (65ch), brandkit intro
        prose: '65ch',
        28: '112px',
        36: '144px',
      },
      // 404 terminal CRT scanlines (original: bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)])
      backgroundImage: {
        scanlines:
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
      },
      // §0.3 shadows
      boxShadow: {
        md: '0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)',
        lg: '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)',
        traffic: 'inset 0 0 0 .5px rgba(0,0,0,.28)',
        // HubSpot input hover / focus (CLONE_SPEC_PAGES §2.2)
        'hs-hover': '0 0 2px 0 #959494',
        'hs-focus': '0 0 3px 0 #959494',
        'hs-active': '0 0 4px 0 #959494',
      },
      // §0.5 / §12
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        250: '250ms',
      },
    },
  },
  plugins: [],
}
