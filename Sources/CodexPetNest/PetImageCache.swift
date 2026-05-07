import Foundation
import AppKit

final class PetImageCache {
    static let shared = PetImageCache()
    
    private let memoryCache = NSCache<NSString, NSImage>()
    private let animationCache = NSCache<NSString, NSArray>() // Array of NSImage
    
    private init() {
        memoryCache.countLimit = 100
        animationCache.countLimit = 20
    }
    
    func getThumbnail(for petId: String) -> NSImage? {
        return memoryCache.object(forKey: "thumb_\(petId)" as NSString)
    }
    
    func setThumbnail(_ image: NSImage, for petId: String) {
        memoryCache.setObject(image, forKey: "thumb_\(petId)" as NSString)
    }
    
    func getSpritesheet(for url: String) -> NSImage? {
        return memoryCache.object(forKey: "sheet_\(url)" as NSString)
    }
    
    func setSpritesheet(_ image: NSImage, for url: String) {
        memoryCache.setObject(image, forKey: "sheet_\(url)" as NSString)
    }
    
    func getAnimation(for petId: String, action: String) -> [NSImage]? {
        return animationCache.object(forKey: "anim_\(petId)_\(action)" as NSString) as? [NSImage]
    }
    
    func setAnimation(_ frames: [NSImage], for petId: String, action: String) {
        animationCache.setObject(frames as NSArray, forKey: "anim_\(petId)_\(action)" as NSString)
    }
    
    func clear() {
        memoryCache.removeAllObjects()
        animationCache.removeAllObjects()
    }
}
