# NetCommander AI ⚡

> **Windows için Modüler, Çoklu Sekmeli ve Tam Otonom (Zero-Click) Yapay Zeka Destekli SSH & Telnet Ağ Yönetim Uygulaması**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078d7.svg)](https://microsoft.com/windows)
[![Electron](https://img.shields.io/badge/Framework-Electron%2034-47848F.svg)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6.svg)](https://www.typescriptlang.org/)

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

## 🚀 Başlangıç & Kurulum

### Gereksinimler
- **Windows 10 / 11** (64-bit)
- **Node.js** (v18 veya üzeri önerilir)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/NetCommander-AI.git
cd NetCommander-AI
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Geliştirme Modunda Çalıştırın
```bash
npm run dev
```

### 4. Windows Kurulum Paketi & Portable EXE Üretin
```cmd
build.bat
```
> Derleme tamamlandığında `C:\Users\...\Desktop\Build_Output` klasöründe hem kurulumsuz çalışan **`NetCommander AI 1.0.0.exe` (Portable)** hem de **`NetCommander AI Setup 1.0.0.exe` (Kurulum Paketi)** hazır olacaktır.

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

## 🔒 Güvenlik & Gizlilik
- **Sıfır Telemetri:** NetCommander AI hiçbir üçüncü taraf sunucuya veri, analitik veya telemetri göndermez.
- **Yerel Saklama:** Cihaz bağlantı bilgileri ve SSH anahtarları yalnızca yerel bilgisayarınızda saklanır.
- **Güvenli Komut Filtresi:** Yıkıcı veya tehlikeli olabilecek komutlar (`rm -rf /`, `mkfs`, `reboot`, `sysupgrade` vb.) tespit edildiğinde otonom icra durdurulur ve kullanıcının manuel onayı istenir.

---

## 📄 Lisans
Bu proje **[MIT Lisansı](LICENSE)** altında tamamen açık kaynaklı olarak sunulmuştur.
