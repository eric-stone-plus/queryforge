import SwiftUI
import WebKit

struct WebView: NSViewRepresentable {
    let url: URL
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        let wv = WKWebView(frame: .zero, configuration: config)
        wv.allowsMagnification = false
        wv.customUserAgent = "QueryForge Desktop/1.0"
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
        .defaultSize(width: 1400, height: 900)
    }
}

struct ContentView: View {
    @State private var isLoading = true
    @State private var showError = false
    private let url = URL(string: "https://queryforge-production-8d6f.up.railway.app")!

    var body: some View {
        ZStack {
            Color(red: 0.03, green: 0.05, blue: 0.09)
                .ignoresSafeArea()

            WebView(url: url)
                .ignoresSafeArea()
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        isLoading = false
                    }
                }

            if isLoading {
                VStack(spacing: 16) {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                        .scaleEffect(1.5)
                    Text("QueryForge 加载中...")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(red: 0.03, green: 0.05, blue: 0.09))
            }
        }
    }
}
