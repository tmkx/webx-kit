import { z } from 'zod';

export const BuiltinProfile = z.enum(['direct', 'auto_detect', 'system', 'fixed_servers', 'pac_script']);

export type BuiltinProfile = z.infer<typeof BuiltinProfile>;

export const ProxyServer = z.object({
  /** The URI of the proxy server. This must be an ASCII hostname (in Punycode format). IDNA is not supported, yet. */
  host: z.string(),
  /** The scheme (protocol) of the proxy server itself. Defaults to 'http'. */
  scheme: z.string().optional(),
  /** The port of the proxy server. Defaults to a port that depends on the scheme. */
  port: z.number().optional(),
});

/** An object encapsulating a single proxy server's specification. */
export interface ProxyServer extends z.infer<typeof ProxyServer> {}
