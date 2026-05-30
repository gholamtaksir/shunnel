package platform

import (
	"os"
	"path/filepath"
)

// AppDirName is the per-user config/data folder name.
const AppDirName = "Shunnel"

// ConfigDir returns (creating if needed) the per-user config directory,
// e.g. %APPDATA%\Shunnel on Windows.
func ConfigDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(base, AppDirName)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", err
	}
	return dir, nil
}

// ConfigFile returns the path to the main config file.
func ConfigFile() (string, error) {
	dir, err := ConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.json"), nil
}
