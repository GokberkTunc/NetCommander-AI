# NetCommander AI ⚡

> **Modular, Multi-Tab, and Fully Autonomous (Zero-Click) AI-Powered SSH & Telnet Network Management Desktop App for Windows**

[![Built With Antigravity](https://img.shields.io/badge/Built%20With-Google%20DeepMind%20Antigravity-8A2BE2.svg)](https://deepmind.google/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078d7.svg)](https://microsoft.com/windows)
[![Electron](https://img.shields.io/badge/Framework-Electron%2034-47848F.svg)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6.svg)](https://www.typescriptlang.org/)

---

🌍 **Languages:** [English](#-english) | [Türkçe](#-t%C3%BCrk%C3%A7e)

---

# 🇬🇧 English

## 💡 The Story Behind This Project (100% Built with AI)

> **Creator's Note:** While the initial vision, requirements, and domain concepts for this tool are mine, **I have never written a single line of code in my life, and I do not have a traditional software engineering background.**
> 
> The entire backend architecture, Electron desktop foundation, multi-session tabs, SSH2/Telnet/SFTP protocol engines, Google Gemini Web DOM streaming integration, self-correcting error-handling loop, and modern retro/dark UI were **100% pair-programmed and built end-to-end with Google DeepMind Antigravity AI** solely through natural language interaction.
> 
> This project stands as concrete proof of how next-generation AI agents empower anyone to build production-ready, compiled desktop applications from scratch.

---

## 🌟 Key Features

### 1. 🤖 Zero-Click Autonomous AI Agent Loop
- **Instant Diagnostics:** Simply type what you need (e.g., *"Check WiFi radios and list connected clients"* or *"Investigate CPU, RAM and disk usage"*).
- **Automated Execution:** The AI generates commands that are automatically sent and executed in the live terminal via `\r\n` without requiring manual button clicks.
- **Bi-Directional Feedback:** Terminal outputs are captured in real time and automatically routed back to the AI for synthesis.
- **Self-Correcting Multi-Step Chaining:** If a command fails or lacks required packages, the AI automatically self-corrects, formulates alternative probe commands, and delivers the final Turkish/English summary seamlessly.

### 2. 🌐 Direct Google AI Pro (Web Session) Integration
- **No API Keys Required:** Leverage your existing Google / Gemini Advanced subscription directly through an Electron background web session for unlimited LLM power.
- **Action-Bar Synchronized Engine:** Streams responses and instantly captures finished outputs via DOM Action-Bar mount detection with sub-second latency.
- **Multi-Provider Support:** Also supports LM Studio (Localhost:1234 inference), Google Gemini API, OpenAI (ChatGPT API), and Anthropic Claude API.

### 3. 🖥️ Chat-First Vertical Split & Resizable Terminal
- **Ergonomic Wide Canvas (1440px):** Clean left/right bubble layout with user messages on the right (`👤 You`) and AI analysis cards on the left (`🤖 NetCommander AI`).
- **Horizontal Terminal:** Built-in xterm.js terminal pane below the chat with a draggable resizer and single-click minimize/expand (`🔽 / 🔼`).

### 4. 📑 Browser-Style Multi-Session Device Tabs
- Connect to multiple network devices (`[OpenWRT Asus]`, `[Raspberry Pi]`, `[Home Server]`) simultaneously. Each tab retains its own isolated terminal stream, chat history, and device memory.

### 5. 🪟 True Standalone Native Windows
- **Settings & Device Manager (`⚙️`):** Standalone native window for registering devices, configuring AI models, Google logins, and inspecting live `debug.log` streams.
- **File Explorer (`📁`):** Dropbear SSH / SFTP enabled standalone Windows Explorer with folder tree, file download/upload, and a remote text/config editor.

### 6. 🔍 Deep Hardware & OpenWrt Diagnostics
- One-click deep discovery probe inspecting CPU cores/frequencies, RAM `MemAvailable`, Flash MTD partitions, OpenWrt `ubus system board/info`, WiFi radio status, and **connected wireless clients (`iwinfo assoclist`)**.

---

## 🚀 Getting Started & Installation

### Requirements
- **Windows 10 / 11** (64-bit)
- **Node.js** (v18 or higher recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/GokberkTunc/NetCommander-AI.git
cd NetCommander-AI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run in Development Mode
```bash
npm run dev
```

### 4. Build Windows Standalone Portable & Setup Installer
```cmd
build.bat
```
> Executables will be generated in `Build_Output/` as **`NetCommander AI 1.0.0.exe` (Portable)** and **`NetCommander AI Setup 1.0.0.exe` (Installer)**.

---

## 🔒 Security & Privacy
- **Zero Telemetry:** NetCommander AI sends zero analytics, tracking data, or credentials to third-party servers.
- **Local Storage:** All credentials and SSH keys remain strictly stored on your local machine.
- **Dangerous Command Guard:** High-risk operations (`rm -rf /`, `mkfs`, `reboot`, `sysupgrade`, etc.) automatically pause the autonomous loop and require manual user confirmation.

---

<br/>

# 🇹🇷 Türkçe

## 💡 Bu Projenin Özel Hikayesi (%100 AI Tarafından Geliştirildi)

> **Geliştirici Notu:** Bu projenin arkasındaki fikir ve vizyon bana ait olsa da, **hayatımda tek bir satır kod yazmadım ve geleneksel yazılım geliştirme bilgisine sahip değilim.**
> 
> Projenin tüm TypeScript/Node.js backend mimarisi, Electron masaüstü altyapısı, çoklu sekme ve oturum yönetimi, SSH2/Telnet/SFTP protokol motorları, Google Gemini Web DOM streaming entegrasyonu, hata ayıklama sistemleri ve modern Retro/Dark kullanıcı arayüzü **%100 Google DeepMind Antigravity AI** asistanı ile doğal dilde konuşularak, adım adım birlikte programlanmıştır (pair-programming).
> 
> Bu proje; yapay zekanın sadece basit kod parçaları üretmekle kalmayıp, sıfırdan üretime hazır, paketlenmiş profesyonel masaüstü yazılımları inşa edebileceğinin somut bir kanıtıdır.

---

## 🌟 Öne Çıkan Özellikler

### 1. 🤖 Tam Otonom Yapay Zeka Ajan Döngüsü (Zero-Click Autonomous Loop)
- **Tek Dokunuşla Teşhis ve Çözüm:** Kullanıcı sadece isteğini yazar (Örn: *"Cihazın kablosuz ağlarını ve bağlı cihazları bul"* veya *"CPU ve RAM durumunu incele"*).
- **Otomatik Komut İcrası:** AI'ın önerdiği sistem komutları hiçbir manuel onay gerektirmeden canlı terminalde `\r\n` ile otomatik çalıştırılır.
- **Otomatik Geri Besleme (Feedback):** Terminal çıktısı oluştuğunda sistem çıktıyı otomatik yakalar ve tekrar AI'a gönderir.
- **Sınırsız Zincirleme:** İlk komut hata verirse veya ardışık teşhis komutları gerekirse, AI kendi kendini düzelterek yeni komutları sırayla dener ve nihai özeti Türkçe olarak sunar.

### 2. 🌐 Google AI Pro (Web) Doğrudan Entegrasyonu
- **API Anahtarı Gerekmez:** Mevcut Google / Gemini Advanced aboneliğinizi Electron arka plan web oturumu ile kullanarak ücretsiz ve limitsiz LLM gücüne erişin.
- **Aksiyon Çubuğu Senkronizasyonu (Action-Bar Synchronized Engine):** Gemini Web yanıtları 150ms aralıkla takip edilir ve Kopyala/Beğen çubuğu belirdiği an sıfır gecikmeyle (%100 tam metin) sohbete aktarılır.
- **Çoklu Sağlayıcı:** LM Studio (Yerel localhost:1234), Google Gemini API, OpenAI (ChatGPT) ve Anthropic Claude API desteği.

### 3. 🖥️ Sohbet Odaklı & Boyutlandırılabilir Terminal Arayüzü
- **Genişletilmiş Sohbet (1440px):** Sağda kullanıcı mesajları (`👤 Siz`), solda AI yanıtları (`🤖 NetCommander AI`) ile ergonomik SysAdmin arayüzü.
- **Yatay Canlı Terminal:** Sohbetin altında yer alan ve aradaki çizgiyle serbestçe boyutlandırılabilen xterm.js tabanlı terminal paneli (`🔽 / 🔼` tek tıkla küçültme).

### 4. 📑 Tarayıcı Tarzı Çoklu Cihaz Sekmeleri (Multi-Session Tabs)
- Aynı anda birden çok cihaza (`[OpenWRT Asus]`, `[Raspberry Pi]`, `[Home Server]`) bağlanıp sekmeler arasında bağımsız terminal oturumları ve izole sohbet geçmişi ile geçiş yapabilme.

### 5. 🪟 Gerçek Bağımsız Windows Pencereleri
- **Ayarlar & Cihaz Yöneticisi (`⚙️`):** Cihaz ekleme, AI yapılandırması, Google oturumu ve canlı `debug.log` konsolu içeren bağımsız pencere.
- **Dosya Gezgini (`📁`):** Dropbear SSH / SFTP destekli, klasör ağacı, dosya indirme/yükleme ve uzaktan metin/yapılandırma düzenleyicisi içeren bağımsız Windows Explorer penceresi.

### 6. 🔍 Derinlemesine Cihaz Tanıma Teşhisi
- Tek tıkla donanım mimarisi, CPU çekirdek/frekans, RAM MemAvailable, Flash MTD yerleşimi, OpenWrt `ubus system board/info`, WiFi radyo durumu ve **bağlı kablosuz istemcileri (`iwinfo assoclist`)** tarayarak cihaz hafızasına kaydetme.

---

## 📂 Proje Dizin Yapısı

```text
NetCommander-AI/
├── assets/                  # Uygulama ikonları ve grafikler
├── scripts/                 # Varlık kopyalama ve derleme betikleri
├── src/
│   ├── ai/                  # AI Ajan Beyni, Web Oturumu & Hafıza Yöneticisi
│   ├── core/                # SSH, Telnet, SFTP ve Derin Cihaz Tarayıcısı
│   ├── main/                # Electron Ana Süreci, IPC & Sistem Tepsisi (Tray)
│   ├── storage/             # SQLite/JSON Veritabanı ve Loglama Motoru
│   └── ui/                  # Sohbet Odaklı HTML/CSS/JS Arayüzü & Bağımsız Pencereler
├── build.bat                # Otonom Windows Derleme ve Paketleme Scripti
├── package.json             # Bağımlılıklar ve Yapılandırma
└── tsconfig.json            # TypeScript Derleyici Ayarları
```

---

## 📄 Lisans / License
Bu proje **[MIT Lisansı](LICENSE)** altında tamamen açık kaynaklı olarak sunulmuştur.
