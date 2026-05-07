import AppKit

enum PomodoroPhase {
    case idle
    case focus
    case rest
    case paused
}

final class PomodoroWidget: NSView {
    private let timeLabel = NSTextField(labelWithString: "")
    private let phaseLabel = NSTextField(labelWithString: "")
    private let startPauseButton = NSButton(title: "Start", target: nil, action: nil)
    private let resetButton = NSButton(title: "Reset", target: nil, action: nil)
    private var timer: Timer?
    private var phase: PomodoroPhase = .idle
    private var lastPhase: PomodoroPhase = .idle
    private var secondsRemaining: Int = 0

    override init(frame: NSRect) {
        super.init(frame: frame)
        wantsLayer = true

        timeLabel.font = .monospacedDigitSystemFont(ofSize: 18, weight: .medium)
        timeLabel.alignment = .center
        timeLabel.textColor = .white
        timeLabel.drawsBackground = false
        timeLabel.stringValue = "25:00"
        addSubview(timeLabel)

        phaseLabel.font = .systemFont(ofSize: 9, weight: .regular)
        phaseLabel.alignment = .center
        phaseLabel.textColor = .white.withAlphaComponent(0.6)
        phaseLabel.drawsBackground = false
        phaseLabel.stringValue = "Ready"
        addSubview(phaseLabel)

        startPauseButton.wantsLayer = true
        startPauseButton.layer?.cornerRadius = 4
        startPauseButton.font = .systemFont(ofSize: 10, weight: .medium)
        startPauseButton.bezelStyle = .inline
        startPauseButton.isBordered = false
        startPauseButton.contentTintColor = .white
        startPauseButton.target = self
        startPauseButton.action = #selector(toggleStartPause)
        addSubview(startPauseButton)

        resetButton.wantsLayer = true
        resetButton.layer?.cornerRadius = 4
        resetButton.font = .systemFont(ofSize: 10, weight: .medium)
        resetButton.bezelStyle = .inline
        resetButton.isBordered = false
        resetButton.contentTintColor = .white.withAlphaComponent(0.7)
        resetButton.target = self
        resetButton.action = #selector(doReset)
        addSubview(resetButton)

        updateDisplay()
        NotificationCenter.default.addObserver(self, selector: #selector(toggleStartPause), name: .togglePomodoro, object: nil)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func layout() {
        super.layout()
        let w = bounds.width
        let h = bounds.height
        timeLabel.frame = NSRect(x: 0, y: h - 26, width: w, height: 22)
        phaseLabel.frame = NSRect(x: 0, y: h - 34, width: w, height: 10)
        
        // Horizontally align both buttons by unifying the Y coordinate
        let gap: CGFloat = 22
        let btnW: CGFloat = 42
        let baseStartX = (w - (btnW * 2 + gap)) / 2
        let baseResetX = baseStartX + btnW + gap
        let baseBottomY: CGFloat = 4
        
        let unifiedY: CGFloat = baseBottomY - 7
        startPauseButton.frame = NSRect(x: baseStartX - 10, y: unifiedY, width: btnW, height: 18)
        resetButton.frame = NSRect(x: baseResetX + 10, y: unifiedY, width: btnW, height: 18)
    }

    @objc private func toggleStartPause() {
        switch phase {
        case .idle, .paused:
            startOrResume()
        case .focus, .rest:
            pause()
        }
    }

    @objc private func doReset() {
        phase = .idle
        secondsRemaining = SettingsStore.shared.settings.pomodoro.focusMinutes * 60
        updateDisplay()
        timer?.invalidate()
        timer = nil
    }

    private func startOrResume() {
        if phase == .idle {
            phase = .focus
            secondsRemaining = SettingsStore.shared.settings.pomodoro.focusMinutes * 60
        } else if phase == .paused {
            phase = lastPhase
        }
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.tick()
        }
        updateDisplay()
    }

    private func pause() {
        if phase != .paused {
            lastPhase = phase
        }
        phase = .paused
        timer?.invalidate()
        timer = nil
        updateDisplay()
    }

    private func tick() {
        secondsRemaining -= 1
        if secondsRemaining <= 0 {
            if phase == .focus {
                phase = .rest
                secondsRemaining = SettingsStore.shared.settings.pomodoro.breakMinutes * 60
            } else {
                phase = .idle
                secondsRemaining = SettingsStore.shared.settings.pomodoro.focusMinutes * 60
                timer?.invalidate()
                timer = nil
            }
        }
        updateDisplay()
    }

    private func updateDisplay() {
        let m = secondsRemaining / 60
        let s = secondsRemaining % 60
        timeLabel.stringValue = String(format: "%02d:%02d", m, s)
        switch phase {
        case .idle:   phaseLabel.stringValue = "Ready"
        case .focus:  phaseLabel.stringValue = "Focus"
        case .rest:   phaseLabel.stringValue = "Break"
        case .paused: phaseLabel.stringValue = "Paused"
        }
        switch phase {
        case .idle, .paused:
            startPauseButton.title = "▶ Start"
            startPauseButton.layer?.backgroundColor = NSColor.white.withAlphaComponent(0.06).cgColor
        case .focus, .rest:
            startPauseButton.title = "Ⅱ Pause"
            startPauseButton.layer?.backgroundColor = NSColor.black.withAlphaComponent(0.08).cgColor
        }
        startPauseButton.layer?.borderWidth = 0
        
        resetButton.layer?.backgroundColor = NSColor.white.withAlphaComponent(0.04).cgColor
        resetButton.layer?.borderWidth = 0
    }
}
