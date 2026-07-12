const PLATFORM_SETTINGS_URLS = {
  github: 'https://github.com/settings/profile',
  gitlab: 'https://gitlab.com/-/profile',
  instagram: 'https://www.instagram.com/accounts/edit/',
  twitter: 'https://twitter.com/settings/profile',
  x: 'https://twitter.com/settings/profile',
  tiktok: 'https://www.tiktok.com/setting',
  reddit: 'https://www.reddit.com/settings/profile',
  pinterest: 'https://www.pinterest.com/settings/',
  twitch: 'https://www.twitch.tv/settings/profile',
  spotify: 'https://www.spotify.com/account/profile/',
  deviantart: 'https://www.deviantart.com/settings/general',
  medium: 'https://medium.com/me/settings',
}

export function getPlatformSettingsUrl(platform) {
  return PLATFORM_SETTINGS_URLS[platform?.toLowerCase()] || null
}