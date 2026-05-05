import Foundation
import AppKit

final class OnlineNestMarketplaceWindowController: NSWindowController, NSTableViewDelegate, NSTableViewDataSource {
    
    static let shared = OnlineNestMarketplaceWindowController()
    
    private var nests: [NestItem] = []
    private var selectedNest: NestDetail?
    private var isInstalling: Bool = false
    private var isLoading: Bool = false
    
    private var listTask: Task<Void, Never>?
    private var detailTask: Task<Void, Never>?
    
    private let tableView = NSTableView()
    private let scrollView = NSScrollView()
    private let searchField = NSSearchField()
    private let loadingIndicator = NSProgressIndicator()
    
    private let detailContainer = NSView()
    private let nameLabel = NSTextField(labelWithString: "")
    private let authorLabel = NSTextField(labelWithString: "")
    private let descriptionLabel = NSTextField(wrappingLabelWithString: "")
    private let metaLabel = NSTextField(labelWithString: "")
    private let tagsLabel = NSTextField(labelWithString: "")
    private let previewImageView = NSImageView()
    private let installButton = NSButton()
    private let applyButton = NSButton()
    private let statusLabel = NSTextField(labelWithString: "")
    
    func show() {
        window?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        if nests.isEmpty { loadData() }
    }
    
    convenience init() {
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 850, height: 580),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Nest Marketplace"
        window.center()
        self.init(window: window)
        setupUI()
    }
    
    private func setupUI() {
        guard let contentView = window?.contentView else { return }
        
        // Search Bar
        searchField.placeholderString = "Search online nests..."
        searchField.target = self
        searchField.action = #selector(searchChanged)
        searchField.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(searchField)
        
        loadingIndicator.style = .spinning
        loadingIndicator.controlSize = .small
        loadingIndicator.isDisplayedWhenStopped = false
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(loadingIndicator)
        
        // Split View (Manual)
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.hasVerticalScroller = true
        scrollView.borderType = .bezelBorder
        contentView.addSubview(scrollView)
        
        tableView.delegate = self
        tableView.dataSource = self
        tableView.headerView = nil
        let column = NSTableColumn(identifier: NSUserInterfaceItemIdentifier("NestColumn"))
        tableView.addTableColumn(column)
        scrollView.documentView = tableView
        
        detailContainer.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(detailContainer)
        
        // Detail View Layout
        previewImageView.imageScaling = .scaleProportionallyUpOrDown
        previewImageView.translatesAutoresizingMaskIntoConstraints = false
        detailContainer.addSubview(previewImageView)
        
        nameLabel.font = .boldSystemFont(ofSize: 24)
        nameLabel.translatesAutoresizingMaskIntoConstraints = false
        detailContainer.addSubview(nameLabel)
        
        authorLabel.textColor = .secondaryLabelColor
        authorLabel.translatesAutoresizingMaskIntoConstraints = false
        detailContainer.addSubview(authorLabel)
        
        descriptionLabel.translatesAutoresizingMaskIntoConstraints = false
        detailContainer.addSubview(descriptionLabel)
        
        metaLabel.textColor = .secondaryLabelColor
        metaLabel.font = .systemFont(ofSize: 11)
        metaLabel.translatesAutoresizingMaskIntoConstraints = false
        detailContainer.addSubview(metaLabel)
        
        tagsLabel.textColor = .systemBlue
        tagsLabel.font = .systemFont(ofSize: 11, weight: .medium)
        tagsLabel.translatesAutoresizingMaskIntoConstraints = false
        detailContainer.addSubview(tagsLabel)
        
        statusLabel.textColor = .secondaryLabelColor
        statusLabel.font = .systemFont(ofSize: 12)
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        detailContainer.addSubview(statusLabel)
        
        installButton.title = "Install"
        installButton.bezelStyle = .rounded
        installButton.target = self
        installButton.action = #selector(installClicked)
        installButton.translatesAutoresizingMaskIntoConstraints = false
        detailContainer.addSubview(installButton)
        
        applyButton.title = "Apply Now"
        applyButton.bezelStyle = .rounded
        applyButton.target = self
        applyButton.action = #selector(applyClicked)
        applyButton.translatesAutoresizingMaskIntoConstraints = false
        detailContainer.addSubview(applyButton)
        
        NSLayoutConstraint.activate([
            searchField.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 16),
            searchField.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            searchField.widthAnchor.constraint(equalToConstant: 280),
            
            loadingIndicator.centerYAnchor.constraint(equalTo: searchField.centerYAnchor),
            loadingIndicator.leadingAnchor.constraint(equalTo: searchField.trailingAnchor, constant: 8),
            
            scrollView.topAnchor.constraint(equalTo: searchField.bottomAnchor, constant: 12),
            scrollView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            scrollView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -16),
            scrollView.widthAnchor.constraint(equalToConstant: 280),
            
            detailContainer.topAnchor.constraint(equalTo: searchField.bottomAnchor, constant: 12),
            detailContainer.leadingAnchor.constraint(equalTo: scrollView.trailingAnchor, constant: 16),
            detailContainer.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            detailContainer.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -16),
            
            previewImageView.topAnchor.constraint(equalTo: detailContainer.topAnchor),
            previewImageView.leadingAnchor.constraint(equalTo: detailContainer.leadingAnchor),
            previewImageView.trailingAnchor.constraint(equalTo: detailContainer.trailingAnchor),
            previewImageView.heightAnchor.constraint(equalToConstant: 200),
            
            nameLabel.topAnchor.constraint(equalTo: previewImageView.bottomAnchor, constant: 16),
            nameLabel.leadingAnchor.constraint(equalTo: detailContainer.leadingAnchor),
            nameLabel.trailingAnchor.constraint(equalTo: detailContainer.trailingAnchor),
            
            authorLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 4),
            authorLabel.leadingAnchor.constraint(equalTo: detailContainer.leadingAnchor),
            
            metaLabel.topAnchor.constraint(equalTo: authorLabel.bottomAnchor, constant: 4),
            metaLabel.leadingAnchor.constraint(equalTo: detailContainer.leadingAnchor),
            
            tagsLabel.topAnchor.constraint(equalTo: metaLabel.bottomAnchor, constant: 8),
            tagsLabel.leadingAnchor.constraint(equalTo: detailContainer.leadingAnchor),
            tagsLabel.trailingAnchor.constraint(equalTo: detailContainer.trailingAnchor),
            
            descriptionLabel.topAnchor.constraint(equalTo: tagsLabel.bottomAnchor, constant: 12),
            descriptionLabel.leadingAnchor.constraint(equalTo: detailContainer.leadingAnchor),
            descriptionLabel.trailingAnchor.constraint(equalTo: detailContainer.trailingAnchor),
            
            statusLabel.bottomAnchor.constraint(equalTo: installButton.topAnchor, constant: -8),
            statusLabel.leadingAnchor.constraint(equalTo: detailContainer.leadingAnchor),
            
            installButton.bottomAnchor.constraint(equalTo: detailContainer.bottomAnchor),
            installButton.leadingAnchor.constraint(equalTo: detailContainer.leadingAnchor),
            installButton.widthAnchor.constraint(equalToConstant: 120),
            
            applyButton.bottomAnchor.constraint(equalTo: detailContainer.bottomAnchor),
            applyButton.leadingAnchor.constraint(equalTo: installButton.trailingAnchor, constant: 12)
        ])
        
        detailContainer.isHidden = true
    }
    
    private func loadData(search: String? = nil) {
        listTask?.cancel()
        isLoading = true
        loadingIndicator.startAnimation(nil)
        
        listTask = Task {
            do {
                let response = try await CodexPetAPI.shared.listNests(search: search)
                if Task.isCancelled { return }
                
                await MainActor.run {
                    self.nests = response.items
                    self.tableView.reloadData()
                    self.isLoading = false
                    self.loadingIndicator.stopAnimation(nil)
                }
            } catch {
                if Task.isCancelled { return }
                print("Failed to load nests: \(error)")
                await MainActor.run {
                    self.isLoading = false
                    self.loadingIndicator.stopAnimation(nil)
                    self.showErrorAlert(message: "Failed to load nests: \(error.localizedDescription)")
                }
            }
        }
    }
    
    @MainActor
    private func showErrorAlert(message: String) {
        let alert = NSAlert()
        alert.messageText = "Network Error"
        alert.informativeText = message
        alert.addButton(withTitle: "Retry")
        alert.addButton(withTitle: "OK")
        if alert.runModal() == .alertFirstButtonReturn {
            loadData(search: searchField.stringValue)
        }
    }
    
    @objc private func searchChanged() {
        loadData(search: searchField.stringValue)
    }
    
    @objc private func installClicked() {
        guard let nest = selectedNest else { return }
        
        isInstalling = true
        installButton.isEnabled = false
        installButton.title = "Installing..."
        
        Task {
            do {
                try await PackageManager.shared.installNest(id: nest.id)
                await MainActor.run {
                    self.isInstalling = false
                    self.updateDetailUI()
                    
                    let alert = NSAlert()
                    alert.messageText = "Nest Installed"
                    alert.informativeText = "Nest skin '\(nest.name)' installed successfully. Would you like to apply it now?"
                    alert.addButton(withTitle: "Apply Now")
                    alert.addButton(withTitle: "OK")
                    if alert.runModal() == .alertFirstButtonReturn {
                        self.applyClicked()
                    }
                }
            } catch {
                await MainActor.run {
                    self.isInstalling = false
                    self.installButton.isEnabled = true
                    self.installButton.title = "Install"
                    
                    let alert = NSAlert()
                    alert.messageText = "Installation Failed"
                    alert.informativeText = error.localizedDescription
                    alert.runModal()
                }
            }
        }
    }
    
    @objc private func applyClicked() {
        guard let nest = selectedNest else { return }
        LocalNestManager.shared.applyNest(id: nest.id)
        updateDetailUI()
    }
    
    private func updateDetailUI() {
        guard let nest = selectedNest else {
            detailContainer.isHidden = true
            return
        }
        
        detailContainer.isHidden = false
        nameLabel.stringValue = nest.name
        authorLabel.stringValue = "by \(nest.author)"
        descriptionLabel.stringValue = nest.description
        
        let dateStr = nest.updatedAt.prefix(10)
        metaLabel.stringValue = "License: \(nest.license) | Updated: \(dateStr)"
        tagsLabel.stringValue = nest.tags.map { "#\($0)" }.joined(separator: " ")
        
        let isInstalled = PackageManager.shared.isNestInstalled(id: nest.id)
        installButton.title = isInstalled ? "Reinstall" : "Install"
        installButton.isEnabled = !isInstalling
        
        let isActive = SettingsStore.shared.settings.activeNestId == nest.id
        applyButton.isHidden = !isInstalled
        applyButton.isEnabled = !isActive
        applyButton.title = isActive ? "Active" : "Apply Now"
        
        statusLabel.stringValue = "ID: \(nest.id) | Version: \(nest.version) | Downloads: \(nest.downloads)"
        
        // Load Preview
        Task {
            if let url = URL(string: nest.previewUrl) {
                if let data = try? Data(contentsOf: url), let image = NSImage(data: data) {
                    await MainActor.run {
                        if self.selectedNest?.id == nest.id {
                            self.previewImageView.image = image
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - TableView
    
    func numberOfRows(in tableView: NSTableView) -> Int {
        return nests.count
    }
    
    func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
        let nest = nests[row]
        let identifier = NSUserInterfaceItemIdentifier("NestCell")
        var cell = tableView.makeView(withIdentifier: identifier, owner: self) as? NSTableCellView
        if cell == nil {
            cell = NSTableCellView(frame: .zero)
            cell?.identifier = identifier
            
            let nameField = NSTextField(labelWithString: "")
            nameField.font = .systemFont(ofSize: 13, weight: .medium)
            nameField.translatesAutoresizingMaskIntoConstraints = false
            cell?.addSubview(nameField)
            cell?.textField = nameField
            
            let authorField = NSTextField(labelWithString: "")
            authorField.font = .systemFont(ofSize: 11)
            authorField.textColor = .secondaryLabelColor
            authorField.translatesAutoresizingMaskIntoConstraints = false
            cell?.addSubview(authorField)
            
            NSLayoutConstraint.activate([
                nameField.topAnchor.constraint(equalTo: cell!.topAnchor, constant: 4),
                nameField.leadingAnchor.constraint(equalTo: cell!.leadingAnchor, constant: 4),
                nameField.trailingAnchor.constraint(equalTo: cell!.trailingAnchor, constant: -4),
                
                authorField.topAnchor.constraint(equalTo: nameField.bottomAnchor, constant: 2),
                authorField.leadingAnchor.constraint(equalTo: cell!.leadingAnchor, constant: 4),
                authorField.bottomAnchor.constraint(equalTo: cell!.bottomAnchor, constant: -4)
            ])
        }
        
        cell?.textField?.stringValue = nest.name
        if let authorField = cell?.subviews.compactMap({ $0 as? NSTextField }).last {
            authorField.stringValue = nest.author
        }
        
        return cell
    }
    
    func tableViewSelectionDidChange(_ notification: Notification) {
        let row = tableView.selectedRow
        guard row >= 0 else {
            selectedNest = nil
            updateDetailUI()
            return
        }
        
        let nestSummary = nests[row]
        detailTask?.cancel()
        
        detailTask = Task {
            do {
                let detail = try await CodexPetAPI.shared.getNest(id: nestSummary.id)
                if Task.isCancelled { return }
                
                await MainActor.run {
                    self.selectedNest = detail
                    self.updateDetailUI()
                }
            } catch {
                if Task.isCancelled { return }
                print("Failed to get nest detail: \(error)")
            }
        }
    }
}
