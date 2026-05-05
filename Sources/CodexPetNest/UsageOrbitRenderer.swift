import AppKit

final class UsageOrbitRenderer: NSView {
    private let reader = UsageLimitReader()
    private var timer: Timer?
    private var info: UsageLimitInfo?
    
    // Hover state
    private var isHovered = false
    
    override init(frame: NSRect) {
        super.init(frame: frame)
        wantsLayer = true
        
        let trackingArea = NSTrackingArea(
            rect: bounds,
            options: [.mouseEnteredAndExited, .activeInActiveApp, .inVisibleRect],
            owner: self,
            userInfo: nil
        )
        addTrackingArea(trackingArea)
        
        timer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            self?.refreshData()
        }
        refreshData()
    }
    
    required init?(coder: NSCoder) { fatalError() }
    
    private func refreshData() {
        self.info = reader.readLatest()
        needsDisplay = true
    }
    
    override func mouseEntered(with event: NSEvent) {
        isHovered = true
        needsDisplay = true
    }
    
    override func mouseExited(with event: NSEvent) {
        isHovered = false
        needsDisplay = true
    }
    
    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        trackingAreas.forEach { removeTrackingArea($0) }
        let trackingArea = NSTrackingArea(
            rect: bounds,
            options: [.mouseEnteredAndExited, .activeInActiveApp, .inVisibleRect],
            owner: self,
            userInfo: nil
        )
        addTrackingArea(trackingArea)
    }
    
    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        
        guard let context = NSGraphicsContext.current?.cgContext else { return }
        
        let center = CGPoint(x: bounds.midX, y: bounds.midY)
        // Adjust radii for 260x260 canvas
        let outerRadius: CGFloat = 110
        let innerRadius: CGFloat = 94
        let lineWidth: CGFloat = 8
        
        // Background tracks
        drawRing(context: context, center: center, radius: outerRadius, percent: 100, color: NSColor.white.withAlphaComponent(0.08), lineWidth: lineWidth)
        drawRing(context: context, center: center, radius: innerRadius, percent: 100, color: NSColor.white.withAlphaComponent(0.08), lineWidth: lineWidth)
        
        // Ticks
        drawTicks(context: context, center: center, radius: outerRadius, count: 12)
        
        if let info = info {
            if let primary = info.primary {
                let color = colorForPercent(primary.remainingPercent)
                drawRing(context: context, center: center, radius: outerRadius, percent: CGFloat(primary.remainingPercent), color: color, lineWidth: lineWidth, glow: true)
            } else {
                drawRing(context: context, center: center, radius: outerRadius, percent: 100, color: NSColor.gray.withAlphaComponent(0.3), lineWidth: lineWidth)
            }
            
            if let secondary = info.secondary {
                let color = colorForPercent(secondary.remainingPercent)
                drawRing(context: context, center: center, radius: innerRadius, percent: CGFloat(secondary.remainingPercent), color: color, lineWidth: lineWidth, glow: true)
            } else {
                drawRing(context: context, center: center, radius: innerRadius, percent: 100, color: NSColor.gray.withAlphaComponent(0.3), lineWidth: lineWidth)
            }
            
            if isHovered {
                drawReadouts(info: info)
            }
        } else {
            let gray = NSColor.gray.withAlphaComponent(0.3)
            drawRing(context: context, center: center, radius: outerRadius, percent: 100, color: gray, lineWidth: lineWidth)
            drawRing(context: context, center: center, radius: innerRadius, percent: 100, color: gray, lineWidth: lineWidth)
        }
    }
    
    private func drawRing(context: CGContext, center: CGPoint, radius: CGFloat, percent: CGFloat, color: NSColor, lineWidth: CGFloat, glow: Bool = false) {
        context.saveGState()
        
        let startAngle: CGFloat = -CGFloat.pi / 2
        let endAngle = startAngle + (percent / 100.0) * (2.0 * .pi)
        
        context.setStrokeColor(color.cgColor)
        context.setLineWidth(lineWidth)
        context.setLineCap(.round)
        
        if glow {
            context.setShadow(offset: .zero, blur: 5, color: color.withAlphaComponent(0.8).cgColor)
        }
        
        context.addArc(center: center, radius: radius, startAngle: startAngle, endAngle: endAngle, clockwise: false)
        context.strokePath()
        
        context.restoreGState()
    }
    
    private func drawTicks(context: CGContext, center: CGPoint, radius: CGFloat, count: Int) {
        context.saveGState()
        context.setStrokeColor(NSColor.white.withAlphaComponent(0.15).cgColor)
        context.setLineWidth(1.5)
        
        for i in 0..<count {
            let angle = CGFloat(i) * (2.0 * .pi / CGFloat(count)) - .pi/2
            let p1 = CGPoint(x: center.x + (radius + 8) * cos(angle), y: center.y + (radius + 8) * sin(angle))
            let p2 = CGPoint(x: center.x + (radius + 16) * cos(angle), y: center.y + (radius + 16) * sin(angle))
            context.move(to: p1)
            context.addLine(to: p2)
        }
        context.strokePath()
        context.restoreGState()
    }
    
    private func colorForPercent(_ percent: Int) -> NSColor {
        if percent < 12 { return .systemRed }
        if percent < 30 { return .systemOrange }
        return .systemCyan
    }
    
    private func drawReadouts(info: UsageLimitInfo) {
        let primaryText = "Primary: \(info.primary?.remainingPercent ?? 0)%"
        let secondaryText = "Secondary: \(info.secondary?.remainingPercent ?? 0)%"
        let sourceText = "Source: \(info.source.rawValue)"
        
        let attributes: [NSAttributedString.Key: Any] = [
            .font: NSFont.monospacedDigitSystemFont(ofSize: 11, weight: .semibold),
            .foregroundColor: NSColor.white,
            .shadow: {
                let s = NSShadow()
                s.shadowBlurRadius = 3
                s.shadowColor = NSColor.black
                return s
            }()
        ]
        
        let pSize = primaryText.size(withAttributes: attributes)
        let sSize = secondaryText.size(withAttributes: attributes)
        let srcSize = sourceText.size(withAttributes: attributes)
        
        primaryText.draw(at: CGPoint(x: bounds.midX - pSize.width / 2, y: bounds.midY + 12), withAttributes: attributes)
        secondaryText.draw(at: CGPoint(x: bounds.midX - sSize.width / 2, y: bounds.midY - 4), withAttributes: attributes)
        
        let srcAttr: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: 9, weight: .medium),
            .foregroundColor: NSColor.white.withAlphaComponent(0.6)
        ]
        sourceText.draw(at: CGPoint(x: bounds.midX - srcSize.width / 2, y: bounds.midY - 20), withAttributes: srcAttr)
    }
}
