//go:build windows

package platform

import "github.com/billgraziano/dpapi"

// Protect encrypts a secret for the current Windows user account using DPAPI.
// An empty string is returned unchanged.
func Protect(plain string) (string, error) {
	if plain == "" {
		return "", nil
	}
	return dpapi.Encrypt(plain)
}

// Unprotect reverses Protect.
func Unprotect(enc string) (string, error) {
	if enc == "" {
		return "", nil
	}
	return dpapi.Decrypt(enc)
}
