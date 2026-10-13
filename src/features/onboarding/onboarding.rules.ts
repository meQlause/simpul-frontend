export type BackupRow = { personId: string; backupId: string };

export type ChannelCheck = {
  connectionStatus: string;
  lastVerification: { status: string } | null;
};

export type Channel = ChannelCheck & {
  id: string;
  displayName: string;
  class: string;
  providerChatTitle: string | null;
};

export type Rule = { id: string; name: string; weeklyEstimate: number; active: boolean };

export type PersonRow = BackupRow & { roleId: string; name: string; role: string };

// Every person must have a backup, and not be their own backup.
export function backupsMissing(rows: BackupRow[]): boolean {
  return rows.some((row) => row.backupId === '' || row.backupId === row.personId);
}

// A group counts only when it is activated and its last check passed.
export function isReady(channel: ChannelCheck): boolean {
  return channel.connectionStatus === 'active' && channel.lastVerification?.status === 'pass';
}

export function hasActiveGroup(channels: ChannelCheck[]): boolean {
  return channels.some(isReady);
}
