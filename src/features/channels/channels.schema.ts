import { z as schema } from 'zod';

const checkSchema = schema.object({
  key: schema.string(),
  status: schema.enum(['pass', 'pending', 'fail']),
  message: schema.string(),
  action: schema.string().nullable(),
});

export const verificationSchema = schema.object({
  id: schema.string(),
  checkedAt: schema.string(),
  expiresAt: schema.string(),
  activationReady: schema.boolean(),
  checks: schema.array(checkSchema),
});

export const channelSchema = schema.object({
  id: schema.string(),
  displayName: schema.string(),
  providerChatId: schema.string(),
  providerChatTitle: schema.string().nullable(),
  providerChatType: schema.string().nullable(),
  memberCount: schema.number().nullable(),
  class: schema.enum(['internal', 'external']),
  primaryLanguage: schema.enum(['auto', 'en', 'id']),
  connectionStatus: schema.enum(['draft', 'verified', 'active', 'paused', 'needs_action']),
  monitored: schema.boolean(),
  configVersion: schema.number(),
  lastVerification: schema
    .object({ status: schema.string(), checkedAt: schema.string() })
    .nullable(),
  verification: verificationSchema.nullable().optional(),
  monitoringStartedAt: schema.string().nullable(),
});

export const responseSchema = schema.object({ data: schema.array(channelSchema) });

const groupSchema = schema.object({
  channelId: schema.string(),
  displayName: schema.string(),
  providerChatId: schema.string(),
  connectionStatus: schema.string(),
});

export const connectionSchema = schema.object({
  id: schema.string(),
  connectionName: schema.string(),
  botUsername: schema.string(),
  status: schema.string(),
  credentialsPresent: schema.boolean(),
  credentialVersion: schema.number(),
  groups: schema.array(groupSchema),
});

export const connectionsSchema = schema.object({ data: schema.array(connectionSchema) });

export const sessionSchema = schema.object({
  id: schema.string(),
  expiresAt: schema.string(),
  state: schema.string(),
  command: schema.string().optional(),
  candidate: schema
    .object({ providerChatId: schema.string(), title: schema.string(), chatType: schema.string() })
    .nullable()
    .optional(),
  receivedAt: schema.string().nullable().optional(),
});

export const credentialCheckSchema = schema.object({
  botUsername: schema.string(),
  sameBotAsStored: schema.boolean().nullable(),
});

export type Channel = schema.infer<typeof channelSchema>;

export type Connection = schema.infer<typeof connectionSchema>;

export type Verification = schema.infer<typeof verificationSchema>;

export type CodeSession = schema.infer<typeof sessionSchema>;
