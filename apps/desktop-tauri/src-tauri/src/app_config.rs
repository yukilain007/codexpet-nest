use directories::ProjectDirs;
use serde::Serialize;

/// Unified application configuration shared with the React frontend
/// via the `get_app_config` Tauri command.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub app_name: String,
    pub version: String,
    pub bundle_id: String,
    pub api_base_url: String,
    pub data_directory: String,
    pub is_debug: bool,
    pub platform: String,
}

impl AppConfig {
    /// Detect runtime configuration from the package info and OS environment.
    pub fn detect(package_info: &tauri::PackageInfo, bundle_id: &str) -> Self {
        let version = package_info.version.to_string();
        let app_name = package_info.name.clone();
        let bundle_id = bundle_id.to_string();

        let data_directory = ProjectDirs::from("xyz", "codexpet", &app_name)
            .map(|dirs| dirs.data_dir().to_string_lossy().to_string())
            .unwrap_or_else(|| get_fallback_data_dir(&app_name, &bundle_id));

        let platform = std::env::consts::OS.to_string();

        Self {
            app_name,
            version,
            bundle_id,
            api_base_url: "https://codexpet.xyz".to_string(),
            data_directory,
            is_debug: cfg!(debug_assertions),
            platform,
        }
    }
}

#[cfg(target_os = "macos")]
fn get_fallback_data_dir(app_name: &str, _bundle_id: &str) -> String {
    let home = dirs::home_dir().unwrap_or_default();
    home.join("Library/Application Support")
        .join(app_name)
        .to_string_lossy()
        .to_string()
}

#[cfg(not(target_os = "macos"))]
fn get_fallback_data_dir(_app_name: &str, bundle_id: &str) -> String {
    let home = dirs::home_dir().unwrap_or_default();
    home.join(format!(".{}", bundle_id.replace('.', "-")))
        .to_string_lossy()
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::PackageInfo;

    fn package_info(name: &str) -> PackageInfo {
        PackageInfo {
            name: name.to_string(),
            version: "0.2.0".parse().expect("valid test version"),
            authors: "CodexPet",
            description: "test",
            crate_name: "codexpet_nest",
        }
    }

    #[test]
    fn companion_variants_have_distinct_runtime_identity_and_storage() {
        let xia = AppConfig::detect(
            &package_info("CodexPet Nest Xia Yizhou"),
            "xyz.codexpet.nest.xiayizhou",
        );
        let shen = AppConfig::detect(
            &package_info("CodexPet Nest Shen Xinghui"),
            "xyz.codexpet.nest.shenxinghui",
        );

        assert_eq!(xia.app_name, "CodexPet Nest Xia Yizhou");
        assert_eq!(xia.bundle_id, "xyz.codexpet.nest.xiayizhou");
        assert_eq!(shen.app_name, "CodexPet Nest Shen Xinghui");
        assert_eq!(shen.bundle_id, "xyz.codexpet.nest.shenxinghui");
        assert_ne!(xia.data_directory, shen.data_directory);
    }
}
