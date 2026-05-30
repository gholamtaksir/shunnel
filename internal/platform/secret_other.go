//go:build !windows

package platform

// Protect is a no-op fallback on non-Windows platforms.
//
// TODO: integrate an OS keyring (macOS Keychain / Linux Secret Service)
// before shipping macOS/Linux builds — secrets are stored as plaintext here.
func Protect(plain string) (string, error) { return plain, nil }

// Unprotect reverses Protect.
func Unprotect(enc string) (string, error) { return enc, nil }
