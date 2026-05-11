import AppKit

final class QuickActionsComponent: NSView, OfficialComponentRenderer {

    private let nestId: String
    private let trigger: String
    private let direction: String
    private let iconStyle: String
    private let maxItems: Int
    private let showLabels: Bool

    private let placeholderLabel = NSTextField(labelWithString: "")
    private let stackView = NSStackView()

    private var isExpanded = false
    private var hoverTrackingArea: NSTrackingArea?
    private var popover: NSPopover?

    init(component: NestComponent, nestId: String) {
        self.nestId = nestId
        let props = component.props ?? [:]

        trigger = props["trigger"]?.stringValue ?? "petHover"
        direction = props["direction"]?.stringValue ?? "right"
        iconStyle = props["iconStyle"]?.stringValue ?? "bubble"
        maxItems = Int(props["maxItems"]?.numberValue ?? 5)
        showLabels = props["showLabels"]?.boolValue ?? false

        super.init(frame: .zero)
        wantsLayer = true
        setupUI()
        refreshActions()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRefreshNotification(_:)),
            name: .refreshQuickActions,
            object: nil
        )
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setupUI() {
        placeholderLabel.font = .systemFont(ofSize: 10, weight: .regular)
        placeholderLabel.textColor = .white.withAlphaComponent(0.35)
        placeholderLabel.alignment = .center
        placeholderLabel.drawsBackground = false
        placeholderLabel.stringValue = ""
        addSubview(placeholderLabel)

        stackView.orientation = .horizontal
        stackView.spacing = 6
        stackView.alignment = .centerY
        stackView.distribution = .fill
        addSubview(stackView)

        setupHoverTracking()
    }

    private func setupHoverTracking() {
        if trigger == "click" { return }

        hoverTrackingArea = NSTrackingArea(
            rect: bounds,
            options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect],
            owner: self,
            userInfo: nil
        )
        if let area = hoverTrackingArea {
            addTrackingArea(area)
        }
    }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let area = hoverTrackingArea {
            removeTrackingArea(area)
        }
        setupHoverTracking()
    }

    override func mouseEntered(with event: NSEvent) {
        guard trigger != "click" else { return }
        // Temporarily disabled to prevent layout jumps
        // expandActions()
    }

    override func mouseExited(with event: NSEvent) {
        guard trigger != "click" else { return }
        // Temporarily disabled to prevent layout jumps
        // collapseActions()
    }

    override func mouseDown(with event: NSEvent) {
        if QuickActionConfigStore.shared.enabledActions(for: nestId).isEmpty {
            openConfigWindow()
            return
        }
        if trigger == "click" {
            isExpanded ? collapseActions() : expandActions()
        }
    }

    override func rightMouseDown(with event: NSEvent) {
        openConfigWindow()
    }

    private func openConfigWindow() {
        QuickActionsConfigWindowController.shared.show(for: nestId)
    }

    override func resetCursorRects() {
        super.resetCursorRects()
        if QuickActionConfigStore.shared.enabledActions(for: nestId).isEmpty {
            addCursorRect(bounds, cursor: .pointingHand)
        }
    }

    override func layout() {
        super.layout()
        placeholderLabel.frame = bounds
        stackView.frame = bounds
    }

    @objc private func handleRefreshNotification(_ notification: Notification) {
        guard let changedNestId = notification.object as? String, changedNestId == nestId else { return }
        DispatchQueue.main.async { [weak self] in
            self?.refreshActions()
        }
    }

    func update(snapshot: MetricSnapshot) {}

    func refreshActions() {
        stackView.arrangedSubviews.forEach { $0.removeFromSuperview() }

        let actions = QuickActionConfigStore.shared.enabledActions(for: nestId)
        if actions.isEmpty {
            placeholderLabel.stringValue = "⚡ Configure Quick Actions"
            placeholderLabel.isHidden = false
            stackView.isHidden = true
            return
        }

        placeholderLabel.isHidden = true
        stackView.isHidden = false

        let limit = min(actions.count, maxItems)
        
        let leadingSpacer = NSView()
        leadingSpacer.translatesAutoresizingMaskIntoConstraints = false
        stackView.addArrangedSubview(leadingSpacer)
        
        for action in actions.prefix(limit) {
            let btn = makeActionButton(for: action)
            stackView.addArrangedSubview(btn)
        }
        
        let trailingSpacer = NSView()
        trailingSpacer.translatesAutoresizingMaskIntoConstraints = false
        stackView.addArrangedSubview(trailingSpacer)
        
        leadingSpacer.widthAnchor.constraint(equalTo: trailingSpacer.widthAnchor).isActive = true
    }

    private func kindLetter(_ kind: QuickActionKind) -> String {
        switch kind {
        case .app:       return "A"
        case .terminal:  return "T"
        case .shortcut:  return "S"
        case .url:       return "U"
        }
    }

    private func makeActionButton(for action: QuickActionConfig) -> NSView {
        let container = HoverButtonView(frame: NSRect(x: 0, y: 0, width: 32, height: 32))
        container.translatesAutoresizingMaskIntoConstraints = false
        container.widthAnchor.constraint(equalToConstant: 32).isActive = true
        container.heightAnchor.constraint(equalToConstant: 32).isActive = true
        container.wantsLayer = true
        container.layer?.cornerRadius = 12
        container.layer?.backgroundColor = NSColor.white.withAlphaComponent(0.12).cgColor

        let btn = NSButton(frame: container.bounds)
        btn.title = showLabels ? action.name : ""
        btn.bezelStyle = .roundRect
        btn.isBordered = false
        btn.wantsLayer = true
        btn.layer?.cornerRadius = 12
        btn.layer?.backgroundColor = NSColor.clear.cgColor

        if let symbolImage = NSImage(systemSymbolName: action.icon, accessibilityDescription: action.name) {
            btn.image = symbolImage
            btn.imagePosition = showLabels ? .imageLeading : .imageOnly
        } else {
            btn.title = kindLetter(action.kind)
            btn.font = .systemFont(ofSize: 16, weight: .bold)
            btn.contentTintColor = .white.withAlphaComponent(0.9)
        }

        btn.target = self
        btn.action = #selector(actionButtonClicked(_:))

        objc_setAssociatedObject(btn, &quickActionConfigKey, action, .OBJC_ASSOCIATION_RETAIN)
        container.addSubview(btn)
        container.actionButton = btn
        return container
    }

    @objc private func actionButtonClicked(_ sender: NSButton) {
        guard let action = objc_getAssociatedObject(sender, &quickActionConfigKey) as? QuickActionConfig else {
            return
        }
        Task { await QuickActionRunner.shared.run(action) }
    }

    private func expandActions() {
        guard !isExpanded else { return }
        isExpanded = true
        stackView.alphaValue = 1.0
        refreshActions()
    }

    private func collapseActions() {
        guard isExpanded else { return }
        isExpanded = false
    }
}

import ObjectiveC

private var quickActionConfigKey: UInt8 = 0

private final class HoverButtonView: NSView {
    weak var actionButton: NSButton?

    private var trackingArea: NSTrackingArea?

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let existing = trackingArea {
            removeTrackingArea(existing)
        }
        let area = NSTrackingArea(
            rect: bounds,
            options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect],
            owner: self,
            userInfo: nil
        )
        addTrackingArea(area)
        trackingArea = area
    }

    override func mouseEntered(with event: NSEvent) {
        animateBackground(to: NSColor.white.withAlphaComponent(0.28).cgColor)
    }

    override func mouseExited(with event: NSEvent) {
        animateBackground(to: NSColor.white.withAlphaComponent(0.12).cgColor)
    }

    private func animateBackground(to color: CGColor) {
        layer?.backgroundColor = color
    }
}
