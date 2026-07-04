import SwiftUI
import WebKit
import Foundation

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

final class LocalServer: ObservableObject {
    static let shared = LocalServer()

    @Published var isReady = false
    @Published var status = "正在启动本地分析服务..."

    let port: Int
    let url: URL

    private var process: Process?
    private var logHandle: FileHandle?

    private init() {
        let chosenPort = Int.random(in: 18100...18999)
        port = chosenPort
        url = URL(string: "http://127.0.0.1:\(chosenPort)")!
    }

    func start() {
        guard process == nil else { return }

        guard let resources = Bundle.main.resourceURL else {
            status = "无法定位应用资源目录"
            return
        }

        let appRoot = resources.appendingPathComponent("app", isDirectory: true)
        let dbPath = resources.appendingPathComponent("data/ecommerce.db").path
        let bundledNode = resources.appendingPathComponent("node/bin/node").path
        let nodePath = FileManager.default.isExecutableFile(atPath: bundledNode) ? bundledNode : "/usr/local/bin/node"

        guard FileManager.default.fileExists(atPath: appRoot.appendingPathComponent("server.js").path) else {
            status = "缺少本地服务入口，请重新构建桌面应用"
            return
        }

        guard FileManager.default.isExecutableFile(atPath: nodePath) else {
            status = "缺少 Node 运行时，请重新构建桌面应用"
            return
        }

        do {
            let support = try appSupportDirectory()
            let logURL = support.appendingPathComponent("queryforge-server.log")
            FileManager.default.createFile(atPath: logURL.path, contents: nil)
            logHandle = try FileHandle(forWritingTo: logURL)

            let child = Process()
            child.executableURL = URL(fileURLWithPath: nodePath)
            child.currentDirectoryURL = appRoot
            child.arguments = ["server.js"]

            child.environment = [
                "PATH": "/usr/bin:/bin:/usr/sbin:/sbin",
                "NODE_ENV": "production",
                "PORT": String(port),
                "HOSTNAME": "127.0.0.1",
                "DB_PATH": dbPath,
                "QUERYFORGE_DESKTOP": "1",
                "QUERYFORGE_CONFIG_DIR": support.path
            ]
            child.standardOutput = logHandle
            child.standardError = logHandle

            try child.run()
            process = child
            pollHealth()
        } catch {
            status = "本地服务启动失败：\(error.localizedDescription)"
        }
    }

    func stop() {
        process?.terminate()
        process = nil
        try? logHandle?.close()
        logHandle = nil
    }

    private func pollHealth() {
        let healthURL = url.appendingPathComponent("api/health")
        DispatchQueue.global(qos: .userInitiated).async {
            for _ in 0..<120 {
                if self.isHealthy(healthURL) {
                    DispatchQueue.main.async {
                        self.isReady = true
                        self.status = "本地分析服务已就绪"
                    }
                    return
                }
                Thread.sleep(forTimeInterval: 0.25)
            }

            DispatchQueue.main.async {
                self.status = "本地服务启动超时，请查看应用支持目录中的 queryforge-server.log"
            }
        }
    }

    private func isHealthy(_ url: URL) -> Bool {
        let semaphore = DispatchSemaphore(value: 0)
        var ok = false
        let task = URLSession.shared.dataTask(with: url) { _, response, _ in
            if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                ok = true
            }
            semaphore.signal()
        }
        task.resume()
        _ = semaphore.wait(timeout: .now() + 1)
        return ok
    }

    private func appSupportDirectory() throws -> URL {
        let base = try FileManager.default.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        let dir = base.appendingPathComponent("QueryForge", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ notification: Notification) {
        LocalServer.shared.stop()
    }
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
    @StateObject private var server = LocalServer.shared

    var body: some View {
        ZStack {
            if server.isReady {
                WebView(url: server.url)
                    .ignoresSafeArea()
            } else {
                VStack(spacing: 14) {
                    Text("Q")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 58, height: 58)
                        .background(
                            LinearGradient(
                                colors: [Color(red: 0.04, green: 0.41, blue: 0.85), Color(red: 0.51, green: 0.31, blue: 0.87)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                    Text("QueryForge")
                        .font(.system(size: 16, weight: .semibold))

                    Text(server.status)
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)

                    ProgressView()
                        .controlSize(.small)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(red: 0.05, green: 0.07, blue: 0.09))
            }
        }
        .onAppear {
            NSApp.appearance = NSAppearance(named: .darkAqua)
            server.start()
        }
    }
}
