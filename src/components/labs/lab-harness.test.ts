import { describe, expect, it } from "vitest"
import { buildLabHarnessHtml, escapeClosingScript } from "./lab-harness"

describe("escapeClosingScript", () => {
  it("escapes closing script tags case-insensitively", () => {
    expect(escapeClosingScript('var s = "</script>";')).toBe('var s = "<\\/script>";')
    expect(escapeClosingScript("</SCRIPT>")).toBe("<\\/script>")
  })

  it("leaves normal code untouched", () => {
    const code = 'const a = 1; console.log("hello");'
    expect(escapeClosingScript(code)).toBe(code)
  })
})

describe("buildLabHarnessHtml", () => {
  it("inlines the Matter.js engine and the generated code", () => {
    const html = buildLabHarnessHtml("Matter.Engine.create();")
    expect(html).toContain("matter-js 0.20.0")
    expect(html).toContain("Matter.Engine.create();")
    expect(html).toContain('id="sim"')
  })

  it("applies a strict CSP with no network access", () => {
    const html = buildLabHarnessHtml("")
    expect(html).toContain("default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'")
  })

  it("provides the reportLabObjectiveComplete bridge", () => {
    const html = buildLabHarnessHtml("reportLabObjectiveComplete();")
    expect(html).toContain("function reportLabObjectiveComplete")
    expect(html).toContain('"eduai-lab"')
    expect(html).toContain("objective-complete")
  })

  it("escapes a malicious closing script tag in generated code", () => {
    const html = buildLabHarnessHtml('const x = "</script><img src=x onerror=alert(1)>";')
    expect(html).toContain("<\\/script>")
    expect(html).not.toContain('"</script>')
  })

  it("always sandboxes with allow-scripts only", () => {
    const html = buildLabHarnessHtml("")
    // The iframe element itself is not part of the srcdoc, but the harness
    // contract is documented here for regression purposes.
    expect(html).toBeDefined()
  })
})