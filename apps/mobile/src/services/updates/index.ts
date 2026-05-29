import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { Capacitor } from '@capacitor/core';
import { Release, ReleaseAsset } from '../../types';

/**
 * Interface for update strategies to support OCP.
 * Allows adding new update methods (e.g., iOS, App Store) without modifying the main logic.
 */
export interface UpdateStrategy {
  canUpdate(): boolean;
  update(release: Release, onProgress?: (percentage: number) => void): Promise<void>;
}

/**
 * Android-specific update strategy using APK download and installation.
 * Follows LSP as it correctly substitutes the UpdateStrategy interface.
 */
export class AndroidUpdateStrategy implements UpdateStrategy {
  canUpdate(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  async update(release: Release, onProgress?: (percentage: number) => void): Promise<void> {
    const apkAsset = release.assets.find(asset => asset.name.endsWith('.apk'));
    if (!apkAsset) {
      throw new Error('No APK found in the release assets.');
    }

    // 1. Resolve destination path in cache
    const fileUri = await Filesystem.getUri({
      directory: Directory.Cache,
      path: `updates/${apkAsset.name}`
    });

    // 2. Setup progress listener
    const progressListener = await FileTransfer.addListener('progress', (progress) => {
      if (progress.contentLength > 0 && onProgress) {
        const percentage = Math.round((progress.bytes / progress.contentLength) * 100);
        onProgress(percentage);
      }
    });

    try {
      // 3. Start download
      const transferResult = await FileTransfer.downloadFile({
        url: apkAsset.browser_download_url,
        path: fileUri.uri,
        progress: true
      });

      // 4. Open the file once downloaded
      await FileOpener.openFile({
        path: transferResult.path,
        mimeType: 'application/vnd.android.package-archive'
      });
    } finally {
      progressListener.remove();
    }
  }
}

/**
 * Fallback update strategy that opens the release page in a browser.
 */
export class BrowserUpdateStrategy implements UpdateStrategy {
  canUpdate(): boolean {
    return true; // Catch-all fallback
  }

  async update(release: Release): Promise<void> {
    window.open(release.html_url, '_blank');
  }
}

/**
 * Update Manager that orchestrates the update process.
 * Follows DIP by depending on the UpdateStrategy abstraction.
 */
export class UpdateManager {
  constructor(private strategies: UpdateStrategy[]) {}

  async handleUpdate(release: Release, onProgress?: (percentage: number) => void): Promise<void> {
    const strategy = this.strategies.find(s => s.canUpdate());
    if (!strategy) {
      throw new Error('No compatible update strategy found.');
    }
    await strategy.update(release, onProgress);
  }
}

// Singleton instance for easy access, injecting concrete strategies.
export const updateManager = new UpdateManager([
  new AndroidUpdateStrategy(),
  new BrowserUpdateStrategy() // Fallback
]);
