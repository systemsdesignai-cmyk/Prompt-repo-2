import { z } from 'zod';

/**
 * Branded types for domain primitives to prevent accidental mixing.
 */
export type GistId = string & { readonly __brand: 'GistId' };
export type GithubToken = string & { readonly __brand: 'GithubToken' };

/**
 * Application State Schema
 */
export const AppStateSchema = z.object({
  folders: z.array(z.any()),
  prompts: z.array(z.any()),
  skills: z.array(z.any()),
  sequences: z.array(z.any()),
  lastSynced: z.string().optional(),
});

export type AppState = z.infer<typeof AppStateSchema>;

/**
 * Sync Configuration Schema
 */
export const SyncConfigSchema = z.object({
  githubToken: z.string().optional(),
  gistId: z.string().optional(),
  autoPushEnabled: z.boolean().default(false),
  pullOnStartEnabled: z.boolean().default(false),
  autoSyncInterval: z.number().default(30),
});

export type SyncConfig = z.infer<typeof SyncConfigSchema>;

/**
 * Release Metadata Schema
 */
export const ReleaseAssetSchema = z.object({
  name: z.string(),
  browser_download_url: z.string().url(),
});

export const ReleaseSchema = z.object({
  tag_name: z.string(),
  name: z.string().nullable(),
  html_url: z.string().url(),
  assets: z.array(ReleaseAssetSchema),
});

export type Release = z.infer<typeof ReleaseSchema>;
export type ReleaseAsset = z.infer<typeof ReleaseAssetSchema>;
