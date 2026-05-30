//go:build windows

package platform

import (
	"sort"
	"strings"
	"unsafe"

	"golang.org/x/sys/windows"
)

// ListProcesses returns the unique executable names (e.g. "chrome.exe") of all
// currently running processes, sorted case-insensitively. Used by the TUN
// app-whitelist picker.
func ListProcesses() []string {
	snapshot, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return nil
	}
	defer windows.CloseHandle(snapshot)

	var entry windows.ProcessEntry32
	entry.Size = uint32(unsafe.Sizeof(entry))

	seen := make(map[string]struct{})
	for err = windows.Process32First(snapshot, &entry); err == nil; err = windows.Process32Next(snapshot, &entry) {
		name := windows.UTF16ToString(entry.ExeFile[:])
		if name != "" && strings.HasSuffix(strings.ToLower(name), ".exe") {
			seen[name] = struct{}{}
		}
	}

	out := make([]string, 0, len(seen))
	for n := range seen {
		out = append(out, n)
	}
	sort.Slice(out, func(i, j int) bool {
		return strings.ToLower(out[i]) < strings.ToLower(out[j])
	})
	return out
}
