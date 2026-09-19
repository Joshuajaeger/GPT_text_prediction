import Foundation

/// A single bundled document (a guide markdown file or an exercise source file).
struct DocRef: Identifiable, Hashable {
    let id: String
    let title: String
    /// Subdirectory within the app bundle's resources, matching the folder
    /// reference name set up in project.yml (nil = bundle root).
    let subdirectory: String?
    let filename: String
    let isCode: Bool

    func loadContent() -> String {
        let name = (filename as NSString).deletingPathExtension
        let ext = (filename as NSString).pathExtension
        guard let url = Bundle.main.url(forResource: name, withExtension: ext, subdirectory: subdirectory) else {
            let where_ = subdirectory.map { " in \($0)/" } ?? ""
            return "Could not find bundled resource \"\(filename)\"\(where_) — try re-running `xcodegen generate` and rebuilding."
        }
        return (try? String(contentsOf: url, encoding: .utf8))
            ?? "Could not read \"\(filename)\" as UTF-8 text."
    }
}

/// A node in the sidebar's document tree. Leaf nodes carry a `doc`; branch
/// nodes carry `children` and are shown as disclosure groups.
final class TutorialNode: Identifiable, Hashable {
    let id: String
    let title: String
    let doc: DocRef?
    var children: [TutorialNode]?

    init(title: String, doc: DocRef? = nil, children: [TutorialNode]? = nil) {
        self.id = doc?.id ?? title
        self.title = title
        self.doc = doc
        self.children = children
    }

    static func == (lhs: TutorialNode, rhs: TutorialNode) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

enum TutorialLibrary {
    private static func guideDoc(_ filename: String, _ title: String) -> DocRef {
        DocRef(id: "guide/\(filename)", title: title, subdirectory: nil, filename: filename, isCode: false)
    }

    private static func buildTrackDoc(_ filename: String, _ title: String) -> DocRef {
        DocRef(id: "build-track/\(filename)", title: title, subdirectory: "03-build-track", filename: filename, isCode: false)
    }

    private static func exerciseDoc(_ stepDir: String, _ filename: String) -> DocRef {
        DocRef(id: "exercises/\(stepDir)/\(filename)", title: filename, subdirectory: "exercises/\(stepDir)", filename: filename, isCode: true)
    }

    private static func stepNode(
        _ number: Int,
        _ title: String,
        guideFile: String,
        exerciseDir: String,
        sourceFile: String,
        testFile: String
    ) -> TutorialNode {
        TutorialNode(
            title: "Step \(number): \(title)",
            children: [
                TutorialNode(title: "Guide", doc: buildTrackDoc(guideFile, "Step \(number): \(title)")),
                TutorialNode(title: sourceFile, doc: exerciseDoc(exerciseDir, sourceFile)),
                TutorialNode(title: testFile, doc: exerciseDoc(exerciseDir, testFile)),
            ]
        )
    }

    static let tree: [TutorialNode] = [
        TutorialNode(title: "Guide", children: [
            TutorialNode(title: "Overview", doc: guideDoc("README.md", "Overview")),
            TutorialNode(title: "0. Motivation", doc: guideDoc("00-motivation.md", "Motivation")),
            TutorialNode(title: "1. Architecture Reference", doc: guideDoc("01-architecture-reference.md", "Architecture Reference")),
            TutorialNode(title: "2. External Sources", doc: guideDoc("02-external-sources.md", "External Sources")),
            TutorialNode(title: "4. Responsible-Use Capstone", doc: guideDoc("04-responsible-use-capstone.md", "Responsible-Use Capstone")),
            TutorialNode(title: "5. Outdated vs Current", doc: guideDoc("05-outdated-vs-current.md", "Outdated vs Current")),
            TutorialNode(title: "6. Recommendations & Caveats", doc: guideDoc("06-recommendations-and-caveats.md", "Recommendations & Caveats")),
        ]),
        TutorialNode(title: "Build Track", children: [
            TutorialNode(title: "Overview", doc: buildTrackDoc("README.md", "Build Track Overview")),
            stepNode(1, "Provider Abstraction", guideFile: "step-1-provider-abstraction.md", exerciseDir: "step-1-provider", sourceFile: "provider.ts", testFile: "provider.test.ts"),
            stepNode(2, "Agent Loop", guideFile: "step-2-agent-loop.md", exerciseDir: "step-2-agent-loop", sourceFile: "agent-loop.ts", testFile: "agent-loop.test.ts"),
            stepNode(3, "Core Tools", guideFile: "step-3-core-tools.md", exerciseDir: "step-3-core-tools", sourceFile: "tools.ts", testFile: "tools.test.ts"),
            stepNode(4, "Sessions & Compaction", guideFile: "step-4-sessions-compaction.md", exerciseDir: "step-4-sessions", sourceFile: "sessions.ts", testFile: "sessions.test.ts"),
            stepNode(5, "Extensions & MCP/Exa", guideFile: "step-5-extensions-mcp-exa.md", exerciseDir: "step-5-extensions", sourceFile: "extensions.ts", testFile: "extensions.test.ts"),
            stepNode(6, "Evaluation & Observability", guideFile: "step-6-evaluation-observability.md", exerciseDir: "step-6-evaluation", sourceFile: "evaluation.ts", testFile: "evaluation.test.ts"),
        ]),
    ]

    static var firstDoc: TutorialNode? {
        tree.first?.children?.first
    }

    static func find(id: TutorialNode.ID?) -> TutorialNode? {
        guard let id else { return nil }
        func search(_ nodes: [TutorialNode]) -> TutorialNode? {
            for node in nodes {
                if node.id == id { return node }
                if let children = node.children, let found = search(children) {
                    return found
                }
            }
            return nil
        }
        return search(tree)
    }
}
