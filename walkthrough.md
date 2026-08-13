# NetCommander AI - v1.1.0 Güncelleme Raporu ve Test Kılavuzu

---

## 🚀 v1.1.0 ile Gelen Yeni Özellikler ve İyileştirmeler

### 1. 🌐 Çoklu Dil Desteği (i18n - English & Türkçe)
- **Tek Tıkla Dil Değiştirme:** Üst bardaki **`🌐 TR / 🌐 EN`** butonuna basarak tüm arayüzü anında Türkçe ve İngilizce arasında değiştirebilirsiniz.
- Ayarlar penceresinden varsayılan dil tercihi kaydedilebilir.

### 2. 🤖 Genişletilmiş Yerel ve Çevrimiçi AI Sağlayıcı Yelpazesi
- **Yerel (Local):**
  - `Google AI Pro (Web)`: API anahtarı gerekmez, limitsiz.
  - `LM Studio`: `http://localhost:1234/v1`
  - `Ollama`: `http://localhost:11434` (Llama 3.2, Qwen2.5, DeepSeek R1 vb.)
  - `Özel OpenAI Uyumlu Uç Nokta`: vLLM, Jan, LocalAI vb.
- **Çevrimiçi (Cloud API):**
  - `DeepSeek API`: `deepseek-chat` (V3) ve `deepseek-reasoner` (R1).
  - `Groq API`: Ultra hızlı Llama 3.3 70B & Mixtral.
  - `OpenRouter API`: Yüzlerce açık ve kapalı model.
  - `Mistral AI`: Mistral Large & Codestral.
  - `Google Gemini API`, `OpenAI API`, `Anthropic Claude API`.

### 3. ⚙️ Otonom Döngü Çalışma Modları (Tam Otonom vs. Onaylı Co-Pilot)
- **⚡ Tam Otonom (Zero-Click):** Komutlar kullanıcı müdahalesi olmadan otomatik terminalde çalışır ve çıktıları analiz edilerek döngü kesintisiz tamamlanır.
- **🛡️ Onaylı / Co-Pilot (Interactive Approval):** AI komutu hazırlar ve durur; kartın üzerindeki *"▶️ Terminalde Çalıştır"* butonuna bastığınızda komut çalışır ve ardından analizi gelir.
- **📖 Yalnızca Danışman (Advisory Only):** Terminale hiçbir komut göndermez, yalnızca soru-cevap ve teknik açıklama yapar.

### 4. 📐 Kompakt Tek Satırlık Üst Bar
- İki satır kaplayan eski başlık ve çip barları tek bir zarif satırda birleştirildi.
- Dikeyde sohbet ve terminal alanı için büyük bir ferahlık kazanıldı.

---

## 📦 Derlenen Yeni Dosyalar (`C:\Users\gokbe\Desktop\Build_Output`)
- **`NetCommander AI 1.0.0.exe`**: Güncel Standalone Portable sürüm (~83 MB).
- **`NetCommander AI Setup 1.0.0.exe`**: Güncel Windows NSIS Kurulum Paketi.
