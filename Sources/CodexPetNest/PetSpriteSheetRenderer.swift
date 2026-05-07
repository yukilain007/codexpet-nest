import Foundation
import AppKit
import CoreGraphics

struct PetAnimationConfig: Codable {
    let row: Int
    let frames: Int
    let fps: Double?
}

struct SpriteSheetDescriptor: Codable {
    let frameWidth: Int
    let frameHeight: Int
    let columns: Int
    let rows: Int
    let animations: [String: PetAnimationConfig]?
}

final class PetSpriteSheetRenderer {
    
    static let shared = PetSpriteSheetRenderer()
    
    private init() {}
    
    /// Heuristic to detect frame size based on CGImage pixels
    func detectDescriptor(cgImage: CGImage, manifest: [String: Any]? = nil) -> SpriteSheetDescriptor {
        let pixelWidth = cgImage.width
        let pixelHeight = cgImage.height
        
        // 1. Try to read from manifest
        if let manifest = manifest {
            let fw = manifest["frameWidth"] as? Int ?? (manifest["frameSize"] as? Int)
            let fh = manifest["frameHeight"] as? Int ?? (manifest["frameSize"] as? Int)
            
            if let fw = fw, let fh = fh {
                let cols = manifest["columns"] as? Int ?? (pixelWidth / fw)
                let rows = manifest["rows"] as? Int ?? (pixelHeight / fh)
                return SpriteSheetDescriptor(
                    frameWidth: fw,
                    frameHeight: fh,
                    columns: cols,
                    rows: rows,
                    animations: nil
                )
            }
        }
        
        // 2. Default Codex Pet Atlas: 8x9
        if pixelWidth % 8 == 0 && pixelHeight % 9 == 0 {
            return SpriteSheetDescriptor(
                frameWidth: pixelWidth / 8,
                frameHeight: pixelHeight / 9,
                columns: 8,
                rows: 9,
                animations: nil
            )
        }
        
        // 3. Fallback to square heuristics
        let commonSizes = [80, 128, 64, 96, 48, 32]
        for size in commonSizes {
            if pixelWidth % size == 0 && pixelHeight % size == 0 {
                return SpriteSheetDescriptor(
                    frameWidth: size,
                    frameHeight: size,
                    columns: pixelWidth / size,
                    rows: pixelHeight / size,
                    animations: nil
                )
            }
        }
        
        // Final fallback: single frame or 1x1 grid
        return SpriteSheetDescriptor(
            frameWidth: pixelWidth,
            frameHeight: pixelHeight,
            columns: 1,
            rows: 1,
            animations: nil
        )
    }
    
    func extractFirstFrame(from image: NSImage, petId: String? = nil) -> NSImage? {
        guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return nil }
        let desc = detectDescriptor(cgImage: cgImage)
        
        if let petId = petId {
            debugExportContactSheet(cgImage: cgImage, desc: desc, petId: petId)
        }
        
        // Find first non-empty frame in row 0
        for col in 0..<desc.columns {
            if let frame = extractFrame(cgImage: cgImage, row: 0, col: col, desc: desc) {
                if !isFrameEmpty(frame) {
                    return frame
                }
            }
        }
        
        // Fallback to first frame if all empty
        return extractFrame(cgImage: cgImage, row: 0, col: 0, desc: desc)
    }
    
    func extractFrame(cgImage: CGImage, row: Int, col: Int, desc: SpriteSheetDescriptor) -> NSImage? {
        if row >= desc.rows || col >= desc.columns { return nil }
        
        let fw = desc.frameWidth
        let fh = desc.frameHeight
        
        let x = col * fw
        let y = row * fh // Top-down
        
        let cropRect = CGRect(x: x, y: y, width: fw, height: fh)
        guard let cropped = cgImage.cropping(to: cropRect) else { return nil }
        
        return NSImage(cgImage: cropped, size: NSSize(width: fw, height: fh))
    }
    
    func extractAnimationFrames(from image: NSImage, action: String, desc: SpriteSheetDescriptor) -> [NSImage] {
        guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return [] }
        
        let row = rowForAction(action)
        if row >= desc.rows { return [] }
        
        var frames: [NSImage] = []
        let maxFramesPerRow = min(desc.columns, 8)
        
        for col in 0..<maxFramesPerRow {
            if let frame = extractFrame(cgImage: cgImage, row: row, col: col, desc: desc) {
                if isFrameEmpty(frame) { continue }
                frames.append(frame)
            }
        }
        return frames
    }
    
    private func rowForAction(_ action: String) -> Int {
        switch action.lowercased() {
        case "idle": return 0
        case "walk": return 1
        case "sleep": return 2
        case "action": return 3
        default: return 0
        }
    }
    
    private func isFrameEmpty(_ image: NSImage) -> Bool {
        guard let tiff = image.tiffRepresentation,
              let rep = NSBitmapImageRep(data: tiff) else { return true }
        
        // Check a few pixels or full scan for transparency
        // For performance, we can just check if alpha is 0 everywhere
        // But for pets, an empty frame usually has 0 alpha for all pixels.
        for y in 0..<Int(rep.pixelsHigh) {
            for x in 0..<Int(rep.pixelsWide) {
                let color = rep.colorAt(x: x, y: y)
                if color?.alphaComponent ?? 0 > 0.05 {
                    return false
                }
            }
        }
        return true
    }
    
    func debugExportContactSheet(cgImage: CGImage, desc: SpriteSheetDescriptor, petId: String) {
        let gridCols = 8
        let gridRows = 4
        let fw = desc.frameWidth
        let fh = desc.frameHeight
        
        let totalW = fw * gridCols
        let totalH = fh * gridRows
        
        guard let context = CGContext(data: nil,
                                    width: totalW,
                                    height: totalH,
                                    bitsPerComponent: 8,
                                    bytesPerRow: 0,
                                    space: CGColorSpaceCreateDeviceRGB(),
                                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return }
        
        for row in 0..<min(desc.rows, gridRows) {
            for col in 0..<min(desc.columns, gridCols) {
                let x = col * fw
                let y = row * fh
                let cropRect = CGRect(x: x, y: y, width: fw, height: fh)
                if let cropped = cgImage.cropping(to: cropRect) {
                    // CGContext coordinate system is bottom-left, but we are drawing top-down
                    let drawRect = CGRect(x: CGFloat(col * fw),
                                        y: CGFloat(totalH - (row + 1) * fh),
                                        width: CGFloat(fw),
                                        height: CGFloat(fh))
                    context.draw(cropped, in: drawRect)
                }
            }
        }
        
        if let outputImage = context.makeImage() {
            let nsImage = NSImage(cgImage: outputImage, size: NSSize(width: totalW, height: totalH))
            if let tiff = nsImage.tiffRepresentation,
               let rep = NSBitmapImageRep(data: tiff),
               let pngData = rep.representation(using: .png, properties: [:]) {
                let path = "/tmp/codexpet-frames-\(petId).png"
                try? pngData.write(to: URL(fileURLWithPath: path))
                print("[PetSpriteSheetRenderer] DEBUG: Exported contact sheet to \(path)")
            }
        }
    }
}
