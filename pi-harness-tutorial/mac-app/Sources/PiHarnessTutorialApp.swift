import SwiftUI

@main
struct PiHarnessTutorialApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 900, minHeight: 600)
        }
        .defaultSize(width: 1180, height: 780)
        .windowToolbarStyle(.unified(showsTitle: true))
    }
}
