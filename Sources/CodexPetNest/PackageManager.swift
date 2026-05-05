import Foundation
import CryptoKit

// MARK: - Package Types

enum PackageType: String {
    case pet = "codexpet.pet"
    case nest = "codexpet.nest"
}

struct PackageManifest: Codable {
    let type: String
    let schemaVersion: String
    let id: String
    let name: String
    let version: String
    let author: String
    let description: String
    let manifest: String?
    let spritesheet: String?
    let preview: String
    let license: String
    let tags: [String]?

    // Nest-specific
    let layout: String?
    let theme: String?
    let widgets: [String]?
}

enum PackageManagerError: Error, LocalizedError {
    case downloadFailed(String)
    case sha256Mismatch(expected: String, actual: String)
    case unzipFailed(String)
    case missingManifest
    case invalidManifest(String)
    case missingRequiredFile(String)
    case pathTraversal(String)
    case unexpectedFileType(String)

    var errorDescription: String? {
        switch self {
        case .downloadFailed(let msg): return "Download failed: \(msg)"
        case .sha256Mismatch(let exp, let act): return "SHA256 mismatch. Expected \(exp.prefix(16))..., got \(act.prefix(16))..."
        case .unzipFailed(let msg): return "Unzip failed: \(msg)"
        case .missingManifest: return "Missing codexpet-package.json"
        case .invalidManifest(let msg): return "Invalid package manifest: \(msg)"
        case .missingRequiredFile(let f): return "Missing required file: \(f)"
        case .pathTraversal(let p): return "Unsafe path detected: \(p)"
        case .unexpectedFileType(let t): return "Unexpected package type: \(t)"
        }
    }
}

// MARK: - Package Manager

final class PackageManager {
    static let shared = PackageManager()

    private let api = CodexPetAPI.shared
    private let supportDir: URL
    private let petsDir: URL
    private let nestsDir: URL
    private let tempDir: URL

    private init() {
        let home = FileManager.default.homeDirectoryForCurrentUser
        supportDir = home.appendingPathComponent("Library/Application Support/CodexPet Nest")
        petsDir = supportDir.appendingPathComponent("pets")
        nestsDir = supportDir.appendingPathComponent("nests")
        tempDir = supportDir.appendingPathComponent("tmp")

        try? FileManager.default.createDirectory(at: petsDir, withIntermediateDirectories: true)
        try? FileManager.default.createDirectory(at: nestsDir, withIntermediateDirectories: true)
        try? FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
    }

    // MARK: - Public API

    func isPetInstalled(id: String) -> Bool {
        FileManager.default.fileExists(atPath: petsDir.appendingPathComponent("\(id)/pet.json").path)
    }

    func isNestInstalled(id: String) -> Bool {
        FileManager.default.fileExists(atPath: nestsDir.appendingPathComponent("\(id)/codexpet-package.json").path)
    }

    func installPet(id: String) async throws {
        let meta = try await api.getPetDownload(id: id)
        try await downloadAndInstall(downloadURL: meta.url, expectedSHA256: meta.sha256, type: .pet)
    }

    func installNest(id: String) async throws {
        let meta = try await api.getNestDownload(id: id)
        try await downloadAndInstall(downloadURL: meta.url, expectedSHA256: meta.sha256, type: .nest)
    }

    // MARK: - Core Flow

    private func downloadAndInstall(downloadURL: String, expectedSHA256: String?, type: PackageType) async throws {
        let (data, _) = try await api.downloadFile(url: downloadURL)

        guard let expected = expectedSHA256 else {
            throw PackageManagerError.invalidManifest("Missing SHA256 for integrity check")
        }

        let actual = sha256Hex(data)
        guard actual == expected else {
            throw PackageManagerError.sha256Mismatch(expected: expected, actual: actual)
        }

        let workDir = tempDir.appendingPathComponent(UUID().uuidString)
        try? FileManager.default.createDirectory(at: workDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: workDir) }

        let zipPath = workDir.appendingPathComponent("package.zip")
        try data.write(to: zipPath, options: .atomic)

        try await unzip(zipPath, to: workDir)

        try? FileManager.default.removeItem(at: zipPath)

        let manifest = try readManifest(from: workDir)
        try validateManifest(manifest, type: type)

        let installDir = (type == .pet ? petsDir : nestsDir).appendingPathComponent(manifest.id)
        try? FileManager.default.removeItem(at: installDir)
        try FileManager.default.createDirectory(at: installDir, withIntermediateDirectories: true)

        let files = try FileManager.default.contentsOfDirectory(atPath: workDir.path)
        for file in files where file != "package.zip" {
            let src = workDir.appendingPathComponent(file)
            let dst = installDir.appendingPathComponent(file)
            try? FileManager.default.removeItem(at: dst)
            try FileManager.default.copyItem(at: src, to: dst)
        }
    }

    // MARK: - Validation

    private func readManifest(from dir: URL) throws -> PackageManifest {
        let enumerator = FileManager.default.enumerator(at: dir, includingPropertiesForKeys: [.isRegularFileKey], options: [.skipsHiddenFiles])
        var manifestURL: URL?

        while let fileURL = enumerator?.nextObject() as? URL {
            if fileURL.lastPathComponent == "codexpet-package.json" {
                manifestURL = fileURL
                break
            }
        }

        guard let url = manifestURL else {
            throw PackageManagerError.missingManifest
        }

        let data = try Data(contentsOf: url)
        let manifest: PackageManifest
        do {
            manifest = try JSONDecoder().decode(PackageManifest.self, from: data)
        } catch {
            throw PackageManagerError.invalidManifest("Could not parse codexpet-package.json: \(error.localizedDescription)")
        }

        return manifest
    }

    private func validateManifest(_ manifest: PackageManifest, type: PackageType) throws {
        guard manifest.type == type.rawValue else {
            throw PackageManagerError.unexpectedFileType(manifest.type)
        }

        let idPattern = try NSRegularExpression(pattern: "^[a-z0-9][a-z0-9-]{1,50}$")
        guard idPattern.firstMatch(in: manifest.id, range: NSRange(manifest.id.startIndex..., in: manifest.id)) != nil else {
            throw PackageManagerError.invalidManifest("Package id must be lowercase letters, numbers, or hyphens")
        }

        guard !manifest.id.contains(".."), !manifest.id.contains("/") else {
            throw PackageManagerError.pathTraversal(manifest.id)
        }

        if type == .pet {
            guard let spritesheet = manifest.spritesheet else {
                throw PackageManagerError.missingRequiredFile("spritesheet")
            }
            guard let manifestFile = manifest.manifest else {
                throw PackageManagerError.missingRequiredFile("manifest (pet.json)")
            }
            guard !spritesheet.contains(".."), !spritesheet.contains("/") else {
                throw PackageManagerError.pathTraversal(spritesheet)
            }
            guard !manifestFile.contains(".."), !manifestFile.starts(with: "/") else {
                throw PackageManagerError.pathTraversal(manifestFile)
            }
        }
    }

    // MARK: - Utilities

    @MainActor
    private func unzip(_ zipPath: URL, to destDir: URL) async throws {
        // P1: Validate zip contents before extraction for path traversal/absolute paths
        let listProcess = Process()
        listProcess.executableURL = URL(fileURLWithPath: "/usr/bin/unzip")
        listProcess.arguments = ["-l", zipPath.path]
        let pipe = Pipe()
        listProcess.standardOutput = pipe
        
        do {
            try listProcess.run()
            listProcess.waitUntilExit()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8) {
                let lines = output.components(separatedBy: .newlines)
                for line in lines {
                    let parts = line.trimmingCharacters(in: .whitespaces).components(separatedBy: .whitespaces).filter { !$0.isEmpty }
                    if parts.count >= 4 {
                        let path = parts.dropFirst(3).joined(separator: " ")
                        if path.contains("..") || path.hasPrefix("/") {
                            throw PackageManagerError.pathTraversal(path)
                        }
                    }
                }
            }
        } catch let error as PackageManagerError {
            throw error
        } catch {
            throw PackageManagerError.unzipFailed("Failed to validate zip: \(error.localizedDescription)")
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/unzip")
        process.arguments = ["-o", "-q", zipPath.path, "-d", destDir.path]
        process.standardOutput = FileHandle.nullDevice
        process.standardError = FileHandle.nullDevice

        do {
            try process.run()
            process.waitUntilExit()
        } catch {
            throw PackageManagerError.unzipFailed(error.localizedDescription)
        }

        guard process.terminationStatus == 0 else {
            throw PackageManagerError.unzipFailed("exit code \(process.terminationStatus)")
        }
    }

    private func sha256Hex(_ data: Data) -> String {
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }
}
