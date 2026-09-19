# Pi Harness Tutorial — Mac App

A native macOS app that packages the whole [`pi-harness-tutorial/`](../README.md)
content — all guide docs and all six build-track exercises — into a
browsable, offline SwiftUI app: sidebar navigation on the left, rendered
markdown (or syntax-plain source code for exercises) on the right.

It's a **viewer/reader**, not an editor or a runtime: the exercises still
run with plain `node --experimental-strip-types` from the terminal, per
the tutorial's own instructions. This app exists to make the tutorial
pleasant to read and navigate on a Mac without a browser or an editor open.

No network access at runtime — markdown is rendered locally via a vendored
copy of [marked.js](https://github.com/markedjs/marked) (MIT licensed),
bundled in `Resources/marked.min.js`.

## Requirements

- macOS 14 (Sonoma) or later
- Xcode 15 or later
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) to generate the
  `.xcodeproj` from `project.yml` (the project file itself isn't checked
  in, so it can't drift from the source layout)

## Build & run

```sh
brew install xcodegen        # one-time, if you don't already have it
cd pi-harness-tutorial/mac-app
xcodegen generate
open PiHarnessTutorial.xcodeproj
```

In Xcode:
1. Select the **PiHarnessTutorial** scheme (should be selected by default).
2. Under the project's **Signing & Capabilities**, pick your personal team
   (or leave it on "Sign to Run Locally" if that option is available) —
   standard for any new local Xcode project.
3. **⌘R** to build and run.

### Without XcodeGen

If you'd rather not install XcodeGen, create the project by hand in Xcode:

1. **File → New → Project… → macOS → App**, product name
   `PiHarnessTutorial`, interface **SwiftUI**, language **Swift**.
2. Delete the auto-generated `ContentView.swift` and `App.swift` Xcode
   creates, then drag in the four files from this folder's `Sources/`
   (check "Copy items if needed" and add them to the target).
3. Drag in this folder's `Resources/` folder, plus `../README.md`,
   `../00-motivation.md`, `../01-architecture-reference.md`,
   `../02-external-sources.md`, `../04-responsible-use-capstone.md`,
   `../05-outdated-vs-current.md`, `../06-recommendations-and-caveats.md`,
   `../03-build-track/`, and `../exercises/` — for the three folders,
   choose **"Create folder references"** (blue folder icon), not groups,
   so `Bundle.main.url(forResource:subdirectory:)` can find their
   contents by subdirectory. Set deployment target to macOS 14.0.
4. Build and run.

## How it's structured

- `Sources/PiHarnessTutorialApp.swift` — app entry point.
- `Sources/TutorialLibrary.swift` — the sidebar's document tree, mapping
  each node to a bundled file (no content is duplicated here — it reads
  the *actual* tutorial files at runtime from the app bundle).
- `Sources/ContentView.swift` — `NavigationSplitView` (sidebar + detail).
- `Sources/DocumentWebView.swift` — a `WKWebView` wrapper that renders
  markdown via `marked.js` for guides, or a plain `<pre><code>` block for
  exercise source files; external links open in your default browser
  instead of navigating away inside the app.
- `Resources/template.html` + `Resources/marked.min.js` — the offline
  rendering shell.
- `project.yml` — the XcodeGen spec. It pulls the actual markdown/exercise
  files from `..` (the tutorial root) as resources, so editing a tutorial
  doc and re-running `xcodegen generate` + rebuilding always shows the
  latest content — there's nothing to keep in sync by hand.

## Updating after you edit the tutorial content

Because the app bundles the real files (not copies baked into Swift code),
adding a *new* guide or exercise step means: add it to `project.yml`'s
`resources:` list, add a matching entry to `TutorialLibrary.swift`, then
`xcodegen generate` again. Editing the *content* of an existing file needs
no project changes at all — just rebuild.
