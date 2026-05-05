import Foundation
import Security

final class KeychainManager {
    static let shared = KeychainManager()

    private let service = "xyz.codexpet.nest"

    private init() {}

    // MARK: - Token Storage

    func storeToken(_ token: String, key: String) -> Bool {
        deleteToken(key: key)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: Data(token.utf8),
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    func getToken(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        guard status == errSecSuccess,
              let data = item as? Data,
              let token = String(data: data, encoding: .utf8)
        else { return nil }

        return token
    }

    func deleteToken(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Convenience

    var accessToken: String? {
        get { getToken(key: "access_token") }
        set {
            if let token = newValue {
                _ = storeToken(token, key: "access_token")
            } else {
                deleteToken(key: "access_token")
            }
        }
    }

    var refreshToken: String? {
        get { getToken(key: "refresh_token") }
        set {
            if let token = newValue {
                _ = storeToken(token, key: "refresh_token")
            } else {
                deleteToken(key: "refresh_token")
            }
        }
    }

    func clearAll() {
        deleteToken(key: "access_token")
        deleteToken(key: "refresh_token")
    }
}
