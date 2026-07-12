import {
  SiGithub, SiGitlab, SiInstagram, SiX, SiTiktok, SiReddit,
  SiPinterest, SiTwitch, SiSpotify, SiDeviantart, SiMedium
} from 'react-icons/si'
import { FiImage, FiGlobe } from 'react-icons/fi'
import { FiImage, FiGlobe, FiAlertTriangle } from 'react-icons/fi'

const PLATFORM_ICON_MAP = {
  github: { Icon: SiGithub, color: '#FFFFFF' },
  gitlab: { Icon: SiGitlab, color: '#FC6D26' },
  instagram: { Icon: SiInstagram, color: '#E4405F' },
  twitter: { Icon: SiX, color: '#FFFFFF' },
  x: { Icon: SiX, color: '#FFFFFF' },
  tiktok: { Icon: SiTiktok, color: '#00F2EA' },
  reddit: { Icon: SiReddit, color: '#FF4500' },
  pinterest: { Icon: SiPinterest, color: '#E60023' },
  twitch: { Icon: SiTwitch, color: '#9146FF' },
  spotify: { Icon: SiSpotify, color: '#1DB954' },
  deviantart: { Icon: SiDeviantart, color: '#05CC47' },
  medium: { Icon: SiMedium, color: '#FFFFFF' },
  image_upload: { Icon: FiImage, color: '#00D9FF' },
  breach: { Icon: FiAlertTriangle, color: '#EF4444' },
}

export function PlatformIcon({ platform, size = 16 }) {
  const entry = PLATFORM_ICON_MAP[platform?.toLowerCase()] || { Icon: FiGlobe, color: '#9CA3AF' }
  const { Icon, color } = entry
  return <Icon size={size} color={color} style={{ flexShrink: 0 }} />
}

export function getPlatformLabel(platform) {
const overrides = { image_upload: 'IMAGE UPLOAD', breach: 'DATA BREACH' }
  return overrides[platform] || platform.toUpperCase()
}