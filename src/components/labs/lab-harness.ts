import matterSource from "matter-js/build/matter.min.js?raw"

/**
 * Escape "</script" sequences so generated code can be inlined into an HTML
 * srcdoc <script> block without terminating it early. `<\/script` parses as
 * `/script` inside JS strings, so code semantics are preserved.
 */
export function escapeClosingScript(text: string): string {
  return text.replace(/<\/script/gi, "<\\/script")
}

/**
 * Build the sandboxed iframe document. The generated code runs in an
 * opaque-origin iframe with a strict CSP that allows only inline scripts and
 * styles — no network, no storage, no parent access. The only bridge to the
 * outside is postMessage for the objective/error events.
 */
export function buildLabHarnessHtml(code: string): string {
  const matter = escapeClosingScript(matterSource)
  const escapedCode = escapeClosingScript(code)
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'">
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #ffffff; }
  #sim { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="sim"></div>
<script>
${matter}
</script>
<script>
var __labObjectiveReported = false;
function reportLabObjectiveComplete() {
  if (__labObjectiveReported) return;
  __labObjectiveReported = true;
  parent.postMessage({ type: "eduai-lab", event: "objective-complete" }, "*");
}
window.addEventListener("error", function (event) {
  parent.postMessage({
    type: "eduai-lab",
    event: "runtime-error",
    message: String(event.message || "Unknown simulation error"),
  }, "*");
});
</script>
<script>
${escapedCode}
</script>
</body>
</html>`
}