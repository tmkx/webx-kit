import { isDev } from '@rsbuild/shared';
import type { Manifest } from './plugins/manifest';

export interface ManifestContext {
  isDev: boolean;
}

export async function defineManifest(
  options: Manifest | ((context: ManifestContext) => Manifest | Promise<Manifest>)
): Promise<Manifest> {
  const context: ManifestContext = {
    isDev: isDev(),
  };
  const manifest = typeof options === 'function' ? await options(context) : options;

  applyCSPPlugin(manifest, context);

  return manifest;
}

function applyCSPPlugin(manifest: Manifest, context: ManifestContext) {
  if (!context.isDev || manifest.content_security_policy?.extension_pages) return;
  manifest.content_security_policy ??= {};
  manifest.content_security_policy.extension_pages = `script-src 'self' http://localhost:${process.env.PORT}/; object-src 'self' http://localhost:${process.env.PORT}/`;
}
