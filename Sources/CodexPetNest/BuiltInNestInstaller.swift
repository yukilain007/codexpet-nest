import Foundation
import AppKit

final class BuiltInNestInstaller {
    static let shared = BuiltInNestInstaller()
    
    private let nestsDir: URL
    private let builtInNestIds = [
        "basket-pomodoro-nest",
        "legend-status-nest",
        "window-desk-nest",
        "quick-actions-demo-nest"
    ]
    
    private init() {
        let home = FileManager.default.homeDirectoryForCurrentUser
        let supportDir = home.appendingPathComponent("Library/Application Support/CodexPet Nest")
        nestsDir = supportDir.appendingPathComponent("nests")
    }
    
    func installIfNeeded() {
        print("[BuiltInNestInstaller] Checking for built-in nests...")
        
        guard let bundledNestsURL = Bundle.main.url(forResource: "BundledNests", withExtension: nil) else {
            print("[BuiltInNestInstaller] BundledNests directory not found in app bundle.")
            return
        }
        
        let fileManager = FileManager.default
        
        for nestId in builtInNestIds {
            let bundledURL = bundledNestsURL.appendingPathComponent(nestId)
            let installedURL = nestsDir.appendingPathComponent(nestId)
            
            guard fileManager.fileExists(atPath: bundledURL.path) else {
                print("[BuiltInNestInstaller] Bundled nest not found: \(nestId)")
                continue
            }
            
            if !fileManager.fileExists(atPath: installedURL.path) {
                // First time installation
                print("[BuiltInNestInstaller] Installing \(nestId) for the first time...")
                try? fileManager.createDirectory(at: nestsDir, withIntermediateDirectories: true)
                try? fileManager.copyItem(at: bundledURL, to: installedURL)
            } else {
                // Check version for update
                if shouldUpdate(bundled: bundledURL, installed: installedURL) {
                    print("[BuiltInNestInstaller] Updating \(nestId) to newer version...")
                    try? fileManager.removeItem(at: installedURL)
                    try? fileManager.copyItem(at: bundledURL, to: installedURL)
                    
                    // If this was the active nest, notify to refresh
                    if SettingsStore.shared.settings.activeNestId == nestId {
                        print("[BuiltInNestInstaller] Active nest updated, notifying refresh.")
                        DispatchQueue.main.async {
                            NotificationCenter.default.post(name: .activeNestChanged, object: nil)
                        }
                    }
                }
            }
        }
        
        LocalNestManager.shared.refresh()
    }
    
    private func shouldUpdate(bundled: URL, installed: URL) -> Bool {
        let bundledManifest = loadManifest(at: bundled)
        let installedManifest = loadManifest(at: installed)
        
        guard let bVer = bundledManifest?.version, let iVer = installedManifest?.version else {
            return false
        }
        
        // Simple version comparison (e.g. "1.0.1" > "1.0.0")
        return bVer.compare(iVer, options: .numeric) == .orderedDescending
    }
    
    private func loadManifest(at folder: URL) -> PackageManifest? {
        let manifestURL = folder.appendingPathComponent("codexpet-package.json")
        guard let data = try? Data(contentsOf: manifestURL) else { return nil }
        return try? JSONDecoder().decode(PackageManifest.self, from: data)
    }
}
