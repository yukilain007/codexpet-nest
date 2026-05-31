import Foundation

enum PetMarketplaceSource: String, Codable, CaseIterable {
    case codexPet
    case petdex

    var displayName: String {
        switch self {
        case .codexPet: return "CodexPet"
        case .petdex: return "Petdex"
        }
    }
}

enum MarketplaceTrustLevel: String, Codable {
    case platformVerified
    case thirdPartyUnsigned
}

struct MarketplacePetItem: Codable, Equatable, Identifiable {
    let id: String
    let source: PetMarketplaceSource
    let sourcePetId: String
    let name: String
    let version: String
    let author: String
    let description: String
    let previewUrl: String
    let tags: [String]
    let detailUrl: String
}

struct MarketplacePetDetail: Codable, Equatable, Identifiable {
    let id: String
    let source: PetMarketplaceSource
    let sourcePetId: String
    let installedPetId: String
    let name: String
    let version: String
    let author: String
    let description: String
    let previewUrl: String
    let tags: [String]
    let license: String
    let downloads: Int
    let updatedAt: String
    let detailUrl: String
    let animations: [String: PetAnimationConfig]?
    let trustLevel: MarketplaceTrustLevel
}

struct MarketplacePetListResponse: Codable, Equatable {
    let items: [MarketplacePetItem]
    let page: Int
    let pageSize: Int
    let total: Int
}

protocol PetMarketplaceProvider {
    var source: PetMarketplaceSource { get }
    var websiteURL: URL { get }

    func listPets(search: String?, page: Int, limit: Int) async throws -> MarketplacePetListResponse
    func getPet(id: String) async throws -> MarketplacePetDetail
    func inspectInstall(id: String) async throws -> String
    func installPet(id: String, expectedInstalledPetId: String?) async throws -> String
}

final class CodexPetMarketplaceProvider: PetMarketplaceProvider {
    let source: PetMarketplaceSource = .codexPet
    let websiteURL = URL(string: "https://codexpet.xyz")!

    func listPets(search: String?, page: Int, limit: Int) async throws -> MarketplacePetListResponse {
        let response = try await CodexPetAPI.shared.listPets(search: search, page: page, limit: limit)
        return MarketplacePetListResponse(
            items: response.items.map { item in
                MarketplacePetItem(
                    id: "codexpet:\(item.id)",
                    source: .codexPet,
                    sourcePetId: item.id,
                    name: item.name,
                    version: item.version,
                    author: item.author,
                    description: item.description,
                    previewUrl: item.previewUrl,
                    tags: item.tags,
                    detailUrl: item.detailUrl
                )
            },
            page: response.page,
            pageSize: response.pageSize,
            total: response.total
        )
    }

    func getPet(id: String) async throws -> MarketplacePetDetail {
        let pet = try await CodexPetAPI.shared.getPet(id: id)
        return MarketplacePetDetail(
            id: "codexpet:\(pet.id)",
            source: .codexPet,
            sourcePetId: pet.id,
            installedPetId: pet.id,
            name: pet.name,
            version: pet.version,
            author: pet.author,
            description: pet.description,
            previewUrl: pet.previewUrl,
            tags: pet.tags,
            license: pet.license,
            downloads: pet.downloads,
            updatedAt: pet.updatedAt,
            detailUrl: pet.detailUrl,
            animations: pet.animations,
            trustLevel: .platformVerified
        )
    }

    func installPet(id: String, expectedInstalledPetId: String? = nil) async throws -> String {
        try await PackageManager.shared.installPet(id: id)
        return id
    }

    func inspectInstall(id: String) async throws -> String {
        id
    }
}

private struct PetdexManifest: Codable {
    let generatedAt: String?
    let total: Int
    let pets: [PetdexPet]
}

private struct PetdexPet: Codable {
    let slug: String
    let displayName: String?
    let kind: String?
    let submittedBy: String?
    let spritesheetUrl: String?
    let petJsonUrl: String?
    let zipUrl: String?
}

private struct PetdexPetJSON: Codable {
    let id: String
}

final class PetdexMarketplaceProvider: PetMarketplaceProvider {
    let source: PetMarketplaceSource = .petdex
    let websiteURL = URL(string: "https://petdex.crafter.run")!

    private let manifestURL = URL(string: "https://petdex.crafter.run/api/manifest")!
    private let session: URLSession
    private let manifestCache = PetdexManifestCache()

    init(session: URLSession = .shared) {
        self.session = session
    }

    func listPets(search: String?, page: Int, limit: Int) async throws -> MarketplacePetListResponse {
        let manifest = try await loadManifest()
        let query = search?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() ?? ""
        let filtered = manifest.pets.filter { pet in
            guard !query.isEmpty else { return true }
            return [pet.slug, pet.displayName ?? "", pet.kind ?? "", pet.submittedBy ?? ""].contains {
                $0.lowercased().contains(query)
            }
        }

        let safeLimit = max(limit, 1)
        let safePage = max(page, 1)
        let start = min((safePage - 1) * safeLimit, filtered.count)
        let end = min(start + safeLimit, filtered.count)
        let pageItems = start < end ? Array(filtered[start..<end]) : []

        return MarketplacePetListResponse(
            items: pageItems.map(mapItem),
            page: safePage,
            pageSize: safeLimit,
            total: filtered.count
        )
    }

    func getPet(id: String) async throws -> MarketplacePetDetail {
        let manifest = try await loadManifest()
        guard let pet = manifest.pets.first(where: { $0.slug == id }) else {
            throw CodexPetAPIError.httpError(
                statusCode: 404,
                apiError: APIError(code: "PETDEX_NOT_FOUND", message: "Petdex pet not found")
            )
        }
        let installedPetId = await resolveInstalledPetId(for: pet)

        return MarketplacePetDetail(
            id: "petdex:\(pet.slug)",
            source: .petdex,
            sourcePetId: pet.slug,
            installedPetId: installedPetId,
            name: pet.displayName ?? pet.slug,
            version: "1.0.0",
            author: pet.submittedBy ?? "Unknown",
            description: pet.kind.map { "Petdex community \($0)" } ?? "Petdex community pet",
            previewUrl: pet.spritesheetUrl ?? "",
            tags: [pet.kind].compactMap { $0 },
            license: "Unknown",
            downloads: 0,
            updatedAt: manifest.generatedAt ?? "",
            detailUrl: websiteURL.absoluteString,
            animations: nil,
            trustLevel: .thirdPartyUnsigned
        )
    }

    func installPet(id: String, expectedInstalledPetId: String? = nil) async throws -> String {
        let manifest = try await loadManifest()
        guard let pet = manifest.pets.first(where: { $0.slug == id }),
              let zipURL = pet.zipUrl,
              URL(string: zipURL) != nil else {
            throw PackageManagerError.downloadFailed("Missing Petdex zip URL")
        }

        return try await PackageManager.shared.installExternalPet(
            downloadURL: zipURL,
            source: "petdex",
            expectedManifestId: expectedInstalledPetId
        )
    }

    func inspectInstall(id: String) async throws -> String {
        let manifest = try await loadManifest()
        guard let pet = manifest.pets.first(where: { $0.slug == id }),
              let zipURL = pet.zipUrl,
              URL(string: zipURL) != nil else {
            throw PackageManagerError.downloadFailed("Missing Petdex zip URL")
        }

        let packageManifest = try await PackageManager.shared.inspectExternalPet(downloadURL: zipURL, source: "petdex")
        return packageManifest.id
    }

    private func loadManifest() async throws -> PetdexManifest {
        if let cached = await manifestCache.get() { return cached }

        var request = URLRequest(url: manifestURL)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw CodexPetAPIError.httpError(statusCode: 0, apiError: nil)
        }
        guard (200..<300).contains(http.statusCode) else {
            throw CodexPetAPIError.httpError(
                statusCode: http.statusCode,
                apiError: APIError(code: "PETDEX_MANIFEST_FAILED", message: "Failed to load Petdex manifest")
            )
        }

        let manifest = try JSONDecoder().decode(PetdexManifest.self, from: data)
        await manifestCache.set(manifest)
        return manifest
    }

    private func mapItem(_ pet: PetdexPet) -> MarketplacePetItem {
        MarketplacePetItem(
            id: "petdex:\(pet.slug)",
            source: .petdex,
            sourcePetId: pet.slug,
            name: pet.displayName ?? pet.slug,
            version: "1.0.0",
            author: pet.submittedBy ?? "Unknown",
            description: pet.kind.map { "Petdex community \($0)" } ?? "Petdex community pet",
            previewUrl: pet.spritesheetUrl ?? "",
            tags: [pet.kind].compactMap { $0 },
            detailUrl: websiteURL.absoluteString
        )
    }

    private func resolveInstalledPetId(for pet: PetdexPet) async -> String {
        guard let petJsonUrl = pet.petJsonUrl, let url = URL(string: petJsonUrl) else {
            return pet.slug
        }

        do {
            var request = URLRequest(url: url)
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            let (data, response) = try await session.data(for: request)
            try Task.checkCancellation()
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                return pet.slug
            }
            let petJSON = try JSONDecoder().decode(PetdexPetJSON.self, from: data)
            return petJSON.id
        } catch is CancellationError {
            return pet.slug
        } catch {
            return pet.slug
        }
    }
}

private actor PetdexManifestCache {
    private var manifest: PetdexManifest?

    func get() -> PetdexManifest? {
        manifest
    }

    func set(_ manifest: PetdexManifest) {
        self.manifest = manifest
    }
}
