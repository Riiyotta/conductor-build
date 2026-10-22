// Renders a local SVG / animated WebP from /public/assets as a CSS mask over `bg-current`,
// so it inherits `color` exactly like the original inline `currentColor` SVGs.
const ICONS = {
  'arrow-right': '/assets/svg/icon-arrow-right.svg',
  'arrow-left': '/assets/svg/icon-arrow-left.svg',
  'arrow-down': '/assets/svg/icon-arrow-down.svg',
  download: '/assets/svg/icon-download.svg',
  menu: '/assets/svg/icon-menu.svg',
  x: '/assets/svg/icon-x.svg',
  'panel-left': '/assets/svg/icon-panel-left.svg',
  house: '/assets/svg/icon-house.svg',
  plus: '/assets/svg/icon-plus.svg',
  'file-text': '/assets/svg/icon-file-text.svg',
  'git-pull-request-arrow': '/assets/svg/icon-git-pull-request-arrow.svg',
  'shield-check': '/assets/svg/icon-shield-check.svg',
  'corner-down-left': '/assets/svg/icon-corner-down-left.svg',
  apple: '/assets/svg/apple-logo.svg',
  openai: '/assets/svg/openai-mark.svg',
  fable: '/assets/svg/claude-fable-mark.svg',
  verified: '/assets/svg/verified-badge.svg',
  logomark: '/assets/svg/conductor-logomark.svg',
  typing: '/assets/img/animations/typing.webp',
  working: '/assets/img/animations/working.webp',
}

export default function Icon({ name, src, className = '', style, ...rest }) {
  const url = `url(${src ?? ICONS[name]})`
  return (
    <span
      aria-hidden="true"
      className={`mask-icon block shrink-0 bg-current ${className}`}
      style={{ WebkitMaskImage: url, maskImage: url, ...style }}
      {...rest}
    />
  )
}
