import Foundation

struct PomodoroSettings: Codable, Equatable {
    var focusMinutes: Int = 25
    var breakMinutes: Int = 5
}

struct Settings: Codable, Equatable {
    var showNest: Bool = true
    var launchAtLogin: Bool = false
    var nestPosition: String = "bottom"
    var theme: String = "default"
    var enabledWidgets: [String] = ["clock", "countdown", "pomodoro", "usage"]
    var countdownTarget: String?
    var pomodoro: PomodoroSettings = PomodoroSettings()
    var managedPetIds: [String] = []
    var activeNestId: String = "default"
}

final class SettingsStore {
    static let shared = SettingsStore()

    var settings = Settings()

    private let supportDir: URL
    private let fileURL: URL

    private init() {
        let home = FileManager.default.homeDirectoryForCurrentUser
        supportDir = home.appendingPathComponent("Library/Application Support/CodexPet Nest")
        fileURL = supportDir.appendingPathComponent("settings.json")
        settings = Settings()

        try? FileManager.default.createDirectory(at: supportDir, withIntermediateDirectories: true)
        print("[SettingsStore] fileURL: \(fileURL.path)")
        load()
    }

    func load() {
        do {
            let data = try Data(contentsOf: fileURL)
            let decoded = try JSONDecoder().decode(Settings.self, from: data)
            settings = decoded
            print("[SettingsStore] loaded activeNestId=\(settings.activeNestId)")
        } catch {
            print("[SettingsStore] load failed: \(error)")
        }
    }

    func save() {
        do {
            let data = try JSONEncoder().encode(settings)
            try data.write(to: fileURL, options: [.atomic, .completeFileProtection])
            print("[SettingsStore] saved activeNestId=\(settings.activeNestId)")
        } catch {
            print("[SettingsStore] save failed: \(error)")
        }
    }

    func widgetEnabled(_ id: String) -> Bool {
        settings.enabledWidgets.contains(id)
    }
}
