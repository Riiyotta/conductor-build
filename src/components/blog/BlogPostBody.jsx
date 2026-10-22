import './blog.css'

// Post body blocks (p / h2 / ul / image), classes as measured on the original.
export default function BlogPostBody({ blocks }) {
  return blocks.map((b, i) => {
    if (b.type === 'h2') {
      return (
        <h2 key={i} className="mb-4 mt-8 text-xl font-semibold text-foreground">
          {b.text}
        </h2>
      )
    }
    if (b.type === 'ul') {
      return (
        <ul key={i} className="blog-inline mb-4 ml-8 list-outside list-disc space-y-2 pl-2">
          {b.items.map((h, j) => (
            <li key={j} className="text-foreground" dangerouslySetInnerHTML={{ __html: h }} />
          ))}
        </ul>
      )
    }
    if (b.type === 'image') {
      return (
        <p key={i} className="mb-4 text-lg leading-relaxed text-foreground">
          <span className="my-6 block">
            <img src={b.src} alt={b.alt} width={b.width} height={b.height} loading="lazy" decoding="async" className="h-auto w-full rounded-lg" />
          </span>
        </p>
      )
    }
    return (
      <p
        key={i}
        className="blog-inline mb-4 text-lg leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: b.html }}
      />
    )
  })
}
