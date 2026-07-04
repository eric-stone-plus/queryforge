import SwiftUI
import WebKit

struct WebView: NSViewRepresentable {
    let url: URL
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        let wv = WKWebView(frame: .zero, configuration: config)
        wv.allowsMagnification = false
        return wv
    }
    func updateNSView(_ wv: WKWebView, context: Context) {
        if wv.url != url {
            wv.load(URLRequest(url: url))
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

@main
struct QueryForgeApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var delegate
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .windowStyle(.titleBar)
        .defaultSize(width: 1440, height: 900)
    }
}

struct ContentView: View {
    private let url = URL(string: "https://queryforge-production-8d6f.up.railway.app")!

    var body: some View {
        WebView(url: url)
            .ignoresSafeArea()
            .onAppear {
                NSApp.appearance = NSAppearance(named: .darkAqua)
            }
    }
}
