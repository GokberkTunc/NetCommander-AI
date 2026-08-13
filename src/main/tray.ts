import { app, Tray, Menu, BrowserWindow, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DbStore } from '../storage/db_store.js';

export class AppTray {
  private static tray: Tray | null = null;

  public static init(mainWindow: BrowserWindow): Tray {
    if (this.tray) return this.tray;

    let iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.ico');
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');
    }

    let trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }

    this.tray = new Tray(trayIcon);
    this.tray.setToolTip('NetCommander AI - SSH / Telnet Ağ Yöneticisi');

    const updateContextMenu = () => {
      const dbStore = DbStore.getInstance();
      const devices = dbStore.getDevices();

      const deviceMenuItems = devices.slice(0, 5).map((dev) => ({
        label: `Bağlan: ${dev.name} (${dev.host})`,
        click: () => {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('quick-connect-device', dev.id);
        },
      }));

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'NetCommander AI Göster',
          click: () => {
            mainWindow.show();
            mainWindow.focus();
          },
        },
        { type: 'separator' },
        ...(deviceMenuItems.length > 0
          ? [
              {
                label: 'Kayıtlı Cihazlar',
                submenu: deviceMenuItems,
              },
              { type: 'separator' as const },
            ]
          : []),
        {
          label: 'Ayarlar',
          click: () => {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('navigate-tab', 'tab-settings');
          },
        },
        { type: 'separator' },
        {
          label: 'Tamamen Kapat',
          click: () => {
            (app as any).isQuitting = true;
            app.quit();
          },
        },
      ]);

      this.tray?.setContextMenu(contextMenu);
    };

    updateContextMenu();

    this.tray.on('double-click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    return this.tray;
  }

  public static showNotification(title: string, content: string): void {
    if (this.tray) {
      this.tray.displayBalloon({
        title,
        content,
        iconType: 'info',
      });
    }
  }

  public static destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
