import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

export class StorageService {
  private static ensureDirExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Writes the encrypted binary buffer to disk inside the secure vault.
   * Zero plaintext is ever written to disk.
   */
  static async saveEncrypted(fileKey: string, encryptedBuffer: Buffer): Promise<void> {
    this.ensureDirExists(config.vaultStorageDir);
    const targetPath = path.join(config.vaultStorageDir, `${fileKey}.enc`);
    await fs.promises.writeFile(targetPath, encryptedBuffer);
  }

  /**
   * Reads the encrypted binary buffer from the vault.
   */
  static async readEncrypted(fileKey: string): Promise<Buffer> {
    const targetPath = path.join(config.vaultStorageDir, `${fileKey}.enc`);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Vault asset not found on disk: ${fileKey}`);
    }
    return await fs.promises.readFile(targetPath);
  }

  /**
   * Safely deletes the encrypted payload from disk.
   */
  static async deleteEncrypted(fileKey: string): Promise<void> {
    const targetPath = path.join(config.vaultStorageDir, `${fileKey}.enc`);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
    }
  }
}
