export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function markdownToHtml(markdown) {
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n')
  const html = []
  let listOpen = false
  let codeOpen = false
  let codeLines = []

  const closeList = () => {
    if (listOpen) {
      html.push('</ul>')
      listOpen = false
    }
  }

  const closeCode = () => {
    if (codeOpen) {
      html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      codeOpen = false
      codeLines = []
    }
  }

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (codeOpen) closeCode()
      else {
        closeList()
        codeOpen = true
        codeLines = []
      }
      continue
    }

    if (codeOpen) {
      codeLines.push(line)
      continue
    }

    if (!line.trim()) {
      closeList()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      closeList()
      const level = heading[1].length
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`)
      continue
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/)
    if (bullet) {
      if (!listOpen) {
        html.push('<ul>')
        listOpen = true
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`)
      continue
    }

    const quote = line.match(/^>\s?(.+)$/)
    if (quote) {
      closeList()
      html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`)
      continue
    }

    closeList()
    html.push(`<p>${inlineMarkdown(line)}</p>`)
  }

  closeCode()
  closeList()
  return html.join('\n')
}

export function htmlDocument({ title, markdown, fontFamily = 'serif' }) {
  const body = markdownToHtml(markdown)
  const safeTitle = escapeHtml(title || 'ZenPad 문서')
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <style>
      body {
        margin: 0;
        background: #f6f1ea;
        color: #262626;
        font-family: ${fontFamily};
        line-height: 1.8;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
        padding: 56px 28px 80px;
        background: rgba(255, 255, 255, 0.72);
        min-height: 100vh;
      }
      h1, h2, h3 { line-height: 1.35; }
      blockquote {
        border-left: 4px solid #fb7185;
        margin-left: 0;
        padding-left: 16px;
        color: #555;
      }
      code {
        background: rgba(0, 0, 0, 0.07);
        border-radius: 4px;
        padding: 2px 4px;
      }
      pre {
        overflow: auto;
        padding: 16px;
        background: #18181b;
        color: #f4f4f5;
        border-radius: 10px;
      }
    </style>
  </head>
  <body>
    <main>
${body}
    </main>
  </body>
</html>`
}
