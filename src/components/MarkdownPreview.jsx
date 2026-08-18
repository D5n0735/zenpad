import { useMemo } from 'react'
import { markdownToHtml } from '../lib/markdown.js'

const FONT_CLASS = {
  myeongjo: 'font-myeongjo',
  gowun: 'font-gowun',
  gothic: 'font-gothic',
  inter: 'font-inter',
  roboto: 'font-roboto',
  lora: 'font-lora',
  garamond: 'font-garamond',
  playfair: 'font-playfair',
  merriweather: 'font-merriweather',
  sourceserif: 'font-sourceserif',
  caveat: 'font-caveat',
  dancing: 'font-dancing',
  jetbrains: 'font-jetbrains'
}

export default function MarkdownPreview({ content, font, fontSize, dark }) {
  const html = useMemo(() => markdownToHtml(content), [content])
  const fontClass = FONT_CLASS[font] || FONT_CLASS.myeongjo

  return (
    <section
      className={`editor-surface no-drag min-h-0 overflow-auto rounded-2xl border border-white/30 bg-white/70 px-9 py-8 text-zinc-800 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/55 dark:text-zinc-100 ${fontClass}`}
    >
      <div className="mb-5 flex items-center justify-between border-b border-black/10 pb-3 text-[11px] uppercase tracking-wider text-zinc-400 dark:border-white/10">
        <span>Markdown Preview</span>
        <span>HTML</span>
      </div>
      <div
        className="markdown-preview"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
        dangerouslySetInnerHTML={{ __html: html || '<p></p>' }}
      />
    </section>
  )
}
