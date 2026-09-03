export type LivePlatform = 'youtube' | 'twitch' | 'custom';

export interface LiveOutputSettings {
  mode: 'rtmp' | 'webrtc';
  platform: LivePlatform;
  endpoint: string;
  streamKey: string;
  title: string;
}

export const defaultLiveOutputSettings: LiveOutputSettings = {
  mode: 'rtmp',
  platform: 'twitch',
  endpoint: 'rtmps://live.twitch.tv/app',
  streamKey: '',
  title: 'Infinite World live session',
};

export function platformLabel(platform: LivePlatform) {
  if (platform === 'youtube') return 'YouTube Live';
  if (platform === 'twitch') return 'Twitch';
  return 'Custom RTMP';
}
