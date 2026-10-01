import AppKit
import Foundation
import SwiftUI
import WebKit

/// Renders a guide's markdown (via a locally-vendored `marked.js`, offline —
/// no network access) or an exercise's raw source as monospaced code, inside
/// a WKWebView, so tables/code fences/links render properly.
struct DocumentWebView: NSViewRepresentable {
    let rawContent: String
    let isCode: Bool

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        guard
            let templateURL = Bundle.main.url(forResource: "template", withExtension: "html", subdirectory: "Resources"),
            let template = try? String(contentsOf: templateURL, encoding: .utf8)
        else {
            webView.loadHTMLString(
                "<p style=\"font-family: -apple-system, sans-serif; padding: 24px;\">" +
                "Missing template.html in the app bundle. Re-run <code>xcodegen generate</code> and rebuild.</p>",
                baseURL: nil
            )
            return
        }

        let html = template
            .replacingOccurrences(of: "%%CONTENT_JSON%%", with: jsStringLiteral(rawContent))
            .replacingOccurrences(of: "%%IS_CODE%%", with: isCode ? "true" : "false")

        webView.loadHTMLString(html, baseURL: templateURL.deletingLastPathComponent())
    }

    /// Safely embeds arbitrary text (markdown or source code) as a JS string
    /// literal by round-tripping it through JSON encoding.
    private func jsStringLiteral(_ text: String) -> String {
        guard let data = try? JSONEncoder().encode(text),
              let literal = String(data: data, encoding: .utf8)
        else {
            return "\"\""
        }
        return literal
    }

    /// Opens http(s) links (readings, external essays/papers) in the
    /// system browser instead of navigating away inside the tutorial view.
    final class Coordinator: NSObject, WKNavigationDelegate {
        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            if navigationAction.navigationType == .linkActivated,
               let url = navigationAction.request.url,
               url.scheme == "http" || url.scheme == "https" {
                NSWorkspace.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }
    }
}
