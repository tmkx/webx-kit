import fs from 'node:fs';
import path from 'node:path';
import type { RsbuildPluginAPI } from '@rsbuild/core';

export type CleanOptions = {
  /**
   * manifest source file path
   *
   * @default ['deploy.yml', 'modern.config.json', 'route.json']
   */
  clean?: string[] | false;
};

const DEFAULT_CLEAN_FILES = ['deploy.yml', 'modern.config.json', 'route.json'];

export function applyCleanSupport(api: RsbuildPluginAPI, { clean = DEFAULT_CLEAN_FILES }: CleanOptions) {
  if (clean === false) return;
  const { distPath } = api.context;
  api.onAfterBuild(async () => {
    for (const file of clean) {
      const filePath = path.resolve(distPath, file);
      if (fs.existsSync(filePath)) await fs.unlinkSync(filePath);
    }
  });
}
