const VOICES: Record<string, { label: string; emoji: string; retired?: boolean }> = {
  'real-estate': { label: 'Real Estate Listing', emoji: '🏠' },
  'wall-street-bro': { label: 'Wall Street Bro', emoji: '📈' },
  'grumpy-local': { label: 'Grumpy Local', emoji: '😤' },
  'gen-z': { label: 'Gen Z', emoji: '💀' },
  millennial: { label: 'Millennial', emoji: '🥑' },
  'dry-humor': { label: 'Dry Humor', emoji: '🧊' },
  // retired voices from earlier versions of the app
  classic: { label: 'Classic Mix', emoji: '🎲', retired: true },
  'bodega-guide': { label: 'Bodega Tour Guide', emoji: '🥪', retired: true },
  'midwest-tourist': { label: 'Midwest Tourist', emoji: '🌽', retired: true },
  'dorm-ra': { label: 'Dorm RA', emoji: '📋', retired: true },
  'subway-philosopher': { label: 'Subway Philosopher', emoji: '🚇', retired: true },
}

export function voiceInfo(key: string) {
  return VOICES[key] ?? { label: key, emoji: '🎭', retired: false }
}

export const ALL_VOICE_KEYS = Object.keys(VOICES)

export const ACTIVE_VOICES = Object.entries(VOICES)
  .filter(([, v]) => !v.retired)
  .map(([key, v]) => ({ key, label: v.label, emoji: v.emoji }))