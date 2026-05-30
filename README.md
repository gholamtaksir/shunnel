# Shunnel

> Tunnel your whole system — or just expose a proxy — through your own SSH servers.
> A lightweight, cross-platform desktop client built on [sing-box](https://github.com/SagerNet/sing-box).

[فارسی ↓](#شانل-فارسی)

---

## Features

- **SSH servers** — add a list of SSH endpoints, see live ping, connect to one.
- **Auto failover** — pick *Auto* and Shunnel uses the fastest reachable server, switching automatically if one drops (sing-box `urltest`).
- **Local proxy** — expose a **SOCKS5 / HTTP / mixed** proxy. Bind to `127.0.0.1`, your LAN IP, or `0.0.0.0`, with optional username/password.
- **Set as system proxy** — one click to route the OS through the proxy (Windows).
- **System tunnel (TUN)** — tunnel the *entire system*, or a **whitelist** of IP ranges (CIDR) and specific applications (by process name/path).
- **Bilingual UI** — English and Persian (with full RTL).
- **Tray, autostart** — minimize to tray and start on login.

## How it works

Each SSH server becomes a sing-box `ssh` outbound (the equivalent of `ssh -D` dynamic port forwarding). A local `mixed`/`socks`/`http` inbound (and optionally a `tun` inbound) routes traffic through it. Failover, routing rules, DNS and the system-proxy toggle are all handled by the embedded sing-box engine.

> **Note:** SSH carries **TCP only** — UDP/QUIC are not tunnelled. In TUN mode, DNS is resolved over DoH through the proxy (full-tunnel) or locally (whitelist).

## Requirements (build)

- [Go](https://go.dev/) 1.23+
- [Node.js](https://nodejs.org/) 18+
- [Wails CLI](https://wails.io/) v2.12: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

## Build

Two build tags are **required**:

| Tag | Purpose |
|-----|---------|
| `with_gvisor` | gVisor network stack for TUN mode |
| `with_clash_api` | In-process traffic tracking and log capture |

```sh
wails build -tags "with_gvisor,with_clash_api"
# → build/bin/Shunnel.exe
```

`wintun.dll` is embedded automatically by sing-tun — nothing to bundle.

For a Windows installer:

```sh
wails build -tags "with_gvisor,with_clash_api" -nsis
```

> TUN mode needs administrator rights; the app will offer to relaunch elevated.

## Usage

1. **Servers** → add an SSH server → *Connect* (or *Auto* for failover).
2. **Proxy** → choose protocol, bind address, optional auth, *Set as system proxy*.
3. **TUN** → enable system-wide tunnel; in *whitelist* mode add CIDRs / app names.

Test the proxy without changing system settings:

```sh
curl --socks5-hostname 127.0.0.1:2080 https://ifconfig.me
```

## License

Shunnel is **GPL-3.0** — it embeds [sing-box](https://github.com/SagerNet/sing-box) as a Go library. See [LICENSE](LICENSE).

---

## شانل (فارسی)

> کل سیستم را — یا فقط یک پروکسی — از طریق سرورهای SSH خودت تونل کن.
> یک کلاینت دسکتاپ سبک و چندسکویی بر پایه‌ی [sing-box](https://github.com/SagerNet/sing-box).

### امکانات

- **سرورهای SSH** — لیست سرورها، پینگ زنده، اتصال به یکی.
- **failover خودکار** — حالت *خودکار* سریع‌ترین سرور را انتخاب می‌کند و اگر قطع شد خودکار جابه‌جا می‌شود.
- **پروکسی محلی** — خروجی **SOCKS5 / HTTP / ترکیبی**؛ bind روی `127.0.0.1`، آی‌پی شبکه، یا `0.0.0.0`، با نام‌کاربری/رمز اختیاری.
- **پروکسی سیستم** — با یک تیک کل سیستم از پروکسی رد می‌شود (ویندوز).
- **تونل سیستم (TUN)** — تونل کل سیستم، یا **وایت‌لیست** بازه‌های IP (CIDR) و برنامه‌های خاص (بر اساس نام/مسیر پروسه).
- **رابط دوزبانه** — فارسی و انگلیسی (با RTL کامل).
- **tray و اجرای خودکار** — مینیمایز به tray و اجرا هنگام ورود.

### نکته

SSH فقط **TCP** را حمل می‌کند — UDP/QUIC تونل نمی‌شوند. در حالت TUN، DNS از طریق DoH روی پروکسی (تونل کامل) یا محلی (وایت‌لیست) حل می‌شود.

### ساخت

دو تگ **الزامی** هستند:

```sh
wails build -tags "with_gvisor,with_clash_api"
```

- `with_gvisor` — network stack برای TUN
- `with_clash_api` — ردیابی ترافیک و لاگ‌ها

`wintun.dll` خودکار embed می‌شود.

### لایسنس

شانل تحت **GPL-3.0** است (چون sing-box را به‌صورت کتابخانه embed می‌کند). فایل [LICENSE](LICENSE) را ببینید.
