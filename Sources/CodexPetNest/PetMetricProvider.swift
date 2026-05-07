import Foundation

final class PetMetricProvider: MetricProvider {
    var refreshInterval: TimeInterval { 60 }

    func snapshot() -> MetricSnapshot {
        var values: [String: MetricValue] = [:]
        
        let currentPet = LocalPetManager.shared.pets.first { $0.isCurrent }
        if let name = currentPet?.displayName {
            // Truncate to 8 characters if too long
            let truncatedName = name.count > 8 ? String(name.prefix(8)) : name
            values["pet.name"] = .text(truncatedName)
        } else {
            values["pet.name"] = .unavailable
        }

        return MetricSnapshot(values: values)
    }
}
