@echo off

echo ===============================================================================
echo                NETCOMMANDER AI - OTONOM DERLEME VE PAKETLEME
echo ===============================================================================
echo.

:: 1. Node.js ve npm yol kontrolu
set "PATH=C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%APPDATA%\npm;%PATH%"

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [*] Node.js sistem yolunda bulunamadi. Winget ile kuruluyor...
    winget install OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
    set "PATH=C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%APPDATA%\npm;%PATH%"
)

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [HATA] Node.js kurulamadi veya bulunamadi. Lutfen Node.js LTS kurun.
    exit /b 1
)

echo [*] Node.js Versiyonu:
node -v
echo [*] NPM Versiyonu:
call npm.cmd -v
echo.

:: 2. Cikti Dizinini Hazirla (Masaustu \Build_Output)
set "OUTPUT_DIR=%USERPROFILE%\Desktop\Build_Output"
if not exist "%OUTPUT_DIR%" (
    echo [*] Cikti klasoru olusturuluyor: %OUTPUT_DIR%
    mkdir "%OUTPUT_DIR%"
) else (
    echo [*] Cikti klasoru mevcut: %OUTPUT_DIR%
)

:: 3. Bagimliliklari yukle
echo [*] Bagimliliklar kontrol ediliyor ve yukleniyor...
call npm.cmd install
if %ERRORLEVEL% neq 0 (
    echo [HATA] npm install basarisiz oldu.
    exit /b %ERRORLEVEL%
)

:: 4. Ikonlari olustur
echo [*] Uygulama ikonlari olusturuluyor...
call node scripts/generate_icons.js

:: 5. TypeScript Derleme ve Asset Kopyalama
echo [*] TypeScript kodlari derleniyor ve arayuz dosyalari hazirlaniyor...
call npm.cmd run build
if %ERRORLEVEL% neq 0 (
    echo [HATA] Proje derleme adimi basarisiz oldu.
    exit /b %ERRORLEVEL%
)

:: 6. Electron-Builder ile Windows Installer & Portable EXE Uretimi
echo.
echo [*] Windows Standalone EXE ve Kurulum Paketi olusturuluyor...
echo [*] Hedef Klasor: %OUTPUT_DIR%
echo.

call npx.cmd electron-builder --win nsis portable --config.directories.output="%OUTPUT_DIR%"
if %ERRORLEVEL% neq 0 (
    echo [HATA] Paketleme islemi basarisiz oldu.
    exit /b %ERRORLEVEL%
)

echo.
echo ===============================================================================
echo                DERLEME VE PAKETLEME BASARIYLA TAMAMLANDI
echo ===============================================================================
echo Uretilen Kurulum ve Portable Dosyalari:
dir /b "%OUTPUT_DIR%\*.exe"
echo.
echo Cikti Klasoru: %OUTPUT_DIR%
echo ===============================================================================
echo.
