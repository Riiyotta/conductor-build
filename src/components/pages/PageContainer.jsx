// CLONE_SPEC_PAGES §0.1 `.site-container`: 900px (--site-content-width) by default, 1280px on
// pricing (`[--site-content-width:80rem]`); padding-block 64 / md 96; padding-inline 16 / md 24 / xl 32
// (original CSS: .site-container{padding-inline:1rem} @768 1.5rem @1280 2rem).
export default function PageContainer({ wide = false, children }) {
  return (
    <section className={`mx-auto w-full ${wide ? 'max-w-7xl' : 'max-w-site'} px-4 py-16 md:px-6 md:py-24 xl:px-8`}>
      {children}
    </section>
  )
}
