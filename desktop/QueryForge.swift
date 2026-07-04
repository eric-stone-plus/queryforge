import SwiftUI
import WebKit

// MARK: - Settings Store

class SettingsStore: ObservableObject {
    @Published var apiKey: String {
        didSet { UserDefaults.standard.set(apiKey, forKey: "mimo_api_key") }
    }
    @Published var baseURL: String {
        didSet { UserDefaults.standard.set(baseURL, forKey: "mimo_base_url") }
    }
    @Published var dbPath: String {
        didSet { UserDefaults.standard.set(dbPath, forKey: "db_path") }
    }
    @Published var useLocalServer: Bool {
        didSet { UserDefaults.standard.set(useLocalServer, forKey: "use_local_server") }
    }

    init() {
        self.apiKey = UserDefaults.standard.string(forKey: "mimo_api_key") ?? ""
        self.baseURL = UserDefaults.standard.string(forKey: "mimo_base_url") ?? "https://token-plan-cn.xiaomimimo.com/v1"
        self.dbPath = UserDefaults.standard.string(forKey: "db_path") ?? ""
        self.useLocalServer = UserDefaults.standard.bool(forKey: "use_local_server")
    }
}

// MARK: - Local Server

class LocalServer: ObservableObject {
    @Published var port: Int = 0
    @Published var isReady = false
    @Published var status = "未启动"
    private var process: Process?

    func start(settings: SettingsStore) {
        port = Int.random(in: 18000...18999)
        status = "正在启动..."

        let nodePath = findNode()
        let projectPath = findProject()

        guard FileManager.default.fileExists(atPath: nodePath) else {
            status = "未找到 Node.js"
            return
        }
        guard FileManager.default.fileExists(atPath: "\(projectPath)/server.js") else {
            status = "未找到服务文件"
            return
        }

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: nodePath)
        proc.arguments = ["\(projectPath)/server.js"]
        proc.environment = [
            "PORT": "\(port)",
            "NODE_ENV": "production",
            "MIMO_API_KEY": settings.apiKey,
            "MIMO_BASE_URL": settings.baseURL,
        ]

        let pipe = Pipe()
        proc.standardOutput = pipe
        proc.standardError = pipe

        proc.terminationHandler = { [weak self] _ in
            DispatchQueue.main.async {
                self?.isReady = false
                self?.status = "服务已停止"
            }
        }

        do {
            try proc.run()
            self.process = proc
            waitForReady()
        } catch {
            status = "启动失败: \(error.localizedDescription)"
        }
    }

    func stop() {
        process?.terminate()
        process = nil
        isReady = false
        status = "已停止"
    }

    private func waitForReady() {
        DispatchQueue.global().asyncAfter(deadline: .now() + 2) { [weak self] in
            guard let self = self else { return }
            let sock = socket(AF_INET, SOCK_STREAM, 0)
            var addr = sockaddr_in()
            addr.sin_family = sa_family_t(AF_INET)
            addr.sin_port = UInt16(self.port).bigEndian
            addr.sin_addr.s_addr = inet_addr("127.0.0.1")
            var connectAddr = addr
            let result = withUnsafeMutablePointer(to: &connectAddr) { ptr in
                ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { s in
                    connect(sock, s, socklen_t(MemoryLayout<sockaddr_in>.size))
                }
            }
            close(sock)

            DispatchQueue.main.async {
                if result == 0 || errno == 56 {
                    self.isReady = true
                    self.status = "本地服务运行中 (:\(self.port))"
                } else {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                        self.isReady = true
                        self.status = "本地服务运行中 (:\(self.port))"
                    }
                }
            }
        }
    }

    private func findNode() -> String {
        let paths = [
            "/usr/local/bin/node",
            "/opt/homebrew/bin/node",
            "/usr/bin/node",
        ]
        for p in paths {
            if FileManager.default.fileExists(atPath: p) { return p }
        }
        return "/usr/local/bin/node"
    }

    private func findProject() -> String {
        let bundle = Bundle.main.bundlePath
        let candidates = [
            "\(bundle)/Contents/Resources",
            bundle,
            "\(bundle)/../..",
        ]
        for c in candidates {
            if FileManager.default.fileExists(atPath: "\(c)/server.js") { return c }
        }
        return bundle
    }
}

// MARK: - WebView

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

// MARK: - Settings View

struct SettingsView: View {
    @ObservedObject var settings: SettingsStore
    @ObservedObject var server: LocalServer
    @Environment(\.dismiss) var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("QueryForge 设置")
                .font(.title2.bold())
                .foregroundColor(.white)

            Divider().background(Color.white.opacity(0.1))

            // Server mode
            GroupBox(label: Text("运行模式").foregroundColor(.white.opacity(0.7))) {
                VStack(alignment: .leading, spacing: 12) {
                    Toggle("使用本地服务（需要 Node.js）", isOn: $settings.useLocalServer)
                        .toggleStyle(.switch)
                        .foregroundColor(.white)

                    HStack {
                        Circle()
                            .fill(server.isReady ? Color.green : Color.gray)
                            .frame(width: 8, height: 8)
                        Text(server.status)
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.6))
                    }

                    if settings.useLocalServer {
                        Text("本地模式：数据存储在本机，不经过云端。需要 Node.js 和项目文件。")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.5))
                    } else {
                        Text("云端模式：连接 Railway 云端服务，无需本地环境。")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                .padding(.vertical, 4)
            }
            

            // API Config
            GroupBox(label: Text("AI 引擎").foregroundColor(.white.opacity(0.7))) {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("API Key")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.6))
                        SecureField("输入 MiMo API Key", text: $settings.apiKey)
                            .textFieldStyle(.roundedBorder)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("API 地址")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.6))
                        TextField("https://token-plan-cn.xiaomimimo.com/v1", text: $settings.baseURL)
                            .textFieldStyle(.roundedBorder)
                    }
                }
                .padding(.vertical, 4)
            }
            

            // Database
            GroupBox(label: Text("数据库").foregroundColor(.white.opacity(0.7))) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        TextField("数据库文件路径（留空使用内置）", text: $settings.dbPath)
                            .textFieldStyle(.roundedBorder)
                        Button("选择...") {
                            let panel = NSOpenPanel()
                            panel.allowedContentTypes = [.database]
                            panel.begin { result in
                                if result == .OK, let url = panel.url {
                                    settings.dbPath = url.path
                                }
                            }
                        }
                    }
                    Text("支持 SQLite 数据库。留空使用内置电商示例数据。")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                }
                .padding(.vertical, 4)
            }
            

            Spacer()

            HStack {
                Spacer()
                Button("完成") { dismiss() }
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding(24)
        .frame(width: 480, height: 520)
        .background(Color(red: 0.06, green: 0.08, blue: 0.12))
    }
}

// MARK: - App

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

@main
struct QueryForgeApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject private var settings = SettingsStore()
    @StateObject private var server = LocalServer()
    @State private var showSettings = false

    var body: some Scene {
        WindowGroup {
            ContentView(server: server, settings: settings, showSettings: $showSettings)
                .preferredColorScheme(.dark)
                .sheet(isPresented: $showSettings) {
                    SettingsView(settings: settings, server: server)
                }
                .onAppear {
                    NSApp.appearance = NSAppearance(named: .darkAqua)
                    if settings.useLocalServer {
                        server.start(settings: settings)
                    }
                }
                .onDisappear { server.stop() }
        }
        .windowStyle(.titleBar)
        .defaultSize(width: 1440, height: 900)
        .commands {
            CommandGroup(after: .appSettings) {
                Button("QueryForge 设置...") { showSettings = true }
                    .keyboardShortcut(",", modifiers: .command)
            }
        }
    }
}

struct ContentView: View {
    @ObservedObject var server: LocalServer
    @ObservedObject var settings: SettingsStore
    @Binding var showSettings: Bool
    @State private var isLoading = true

    private var url: URL {
        if settings.useLocalServer && server.isReady {
            return URL(string: "http://localhost:\(server.port)")!
        }
        return URL(string: "https://queryforge-production-8d6f.up.railway.app")!
    }

    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.05, blue: 0.09)
                .ignoresSafeArea()

            WebView(url: url)
                .ignoresSafeArea()
                .opacity(isLoading ? 0 : 1)

            if isLoading {
                VStack(spacing: 20) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 18)
                            .fill(Color(red: 0.08, green: 0.10, blue: 0.16))
                            .frame(width: 72, height: 72)
                        Text("Q")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red: 0.29, green: 0.64, blue: 1.0))
                    }
                    Text("QueryForge")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.white)
                    Text(settings.useLocalServer ? (server.isReady ? "本地服务就绪" : "正在启动本地服务...") : "连接云端服务")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.5))
                    if settings.useLocalServer && !server.isReady {
                        ProgressView()
                            .progressViewStyle(.circular)
                            .tint(.white.opacity(0.5))
                            .scaleEffect(0.8)
                    }
                    Button("打开设置") { showSettings = true }
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.4))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(red: 0.04, green: 0.05, blue: 0.09))
            }
        }
        .onChange(of: server.isReady) { _, ready in
            if ready { withAnimation { isLoading = false } }
        }
        .onAppear {
            if !settings.useLocalServer {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    withAnimation { isLoading = false }
                }
            }
            // Fallback if local server doesn't start
            DispatchQueue.main.asyncAfter(deadline: .now() + 6) {
                if isLoading { withAnimation { isLoading = false } }
            }
        }
    }
}
