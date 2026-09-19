import SwiftUI

struct ContentView: View {
    @State private var selection: TutorialNode.ID?

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                OutlineGroup(TutorialLibrary.tree, children: \.children) { node in
                    Text(node.title)
                        .tag(node.id)
                }
            }
            .listStyle(.sidebar)
            .navigationTitle("Pi Harness Tutorial")
        } detail: {
            if let node = TutorialLibrary.find(id: selection), let doc = node.doc {
                DocumentContainerView(doc: doc)
                    .id(doc.id)
            } else {
                emptyState
            }
        }
        .onAppear {
            if selection == nil {
                selection = TutorialLibrary.firstDoc?.id
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "book.closed")
                .font(.system(size: 40))
                .foregroundStyle(.secondary)
            Text("Select a Document")
                .font(.title3.bold())
            Text("Choose a guide or exercise from the sidebar.")
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct DocumentContainerView: View {
    let doc: DocRef

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text(doc.title)
                    .font(.title2.bold())
                    .lineLimit(1)
                Spacer()
                if doc.isCode {
                    Label("Exercise source", systemImage: "chevron.left.forwardslash.chevron.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 6)

            Divider()

            DocumentWebView(rawContent: doc.loadContent(), isCode: doc.isCode)
        }
    }
}

#Preview {
    ContentView()
        .frame(width: 1100, height: 720)
}
