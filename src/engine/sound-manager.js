import storage from './storage.js'
import eventBus from './event-bus.js'
import { logger } from './logger.js'

let Howl = null
let howlerLoaded = false
let howlerLoading = false
let soundListenerRegistered = false

const sounds = {}

const registry = {
  click: { src: '/sounds/click.mp3' },
  success: { src: '/sounds/success.mp3' },
  error: { src: '/sounds/error.mp3' },
  timerWarning: { src: '/sounds/timer-warning.mp3' },
  goldGain: { src: '/sounds/gold-gain.mp3' },
  pageFlip: { src: '/sounds/page-flip.mp3' },
  achievementUnlock: { src: '/sounds/achievement-unlock.mp3' },
  ambient: { src: '/sounds/ambient-library.mp3', loop: true, volume: 0.15 },
}

async function loadHowler() {
  if (howlerLoaded) return true
  if (howlerLoading) {
    // Wait for the in-flight import to resolve
    try {
      const mod = await import('howler')
      Howl = mod.Howl
      howlerLoaded = true
      return true
    } catch {
      return false
    }
  }
  howlerLoading = true
  try {
    const mod = await import('howler')
    Howl = mod.Howl
    howlerLoaded = true
    return true
  } catch (err) {
    logger.debug('Howler.js load failed:', err)
    howlerLoading = false
    return false
  }
}

function getSound(name) {
  if (!Howl || !registry[name]) return null
  if (!sounds[name]) {
    const config = registry[name]
    sounds[name] = new Howl({
      src: [config.src],
      loop: config.loop || false,
      volume: config.volume !== undefined ? config.volume : 1,
    })
  }
  return sounds[name]
}

function isSoundEnabled() {
  return storage.get('sound_enabled') ?? true
}

function isMusicEnabled() {
  return storage.get('music_enabled') ?? false
}

async function play(soundName) {
  try {
    if (soundName === 'ambient') {
      if (!isMusicEnabled()) return
    } else {
      if (!isSoundEnabled()) return
    }

    const loaded = await loadHowler()
    if (!loaded) return

    const sound = getSound(soundName)
    if (sound) {
      sound.play()
    }
  } catch (err) {
    logger.debug('Sound play failed:', soundName, err)
  }
}

function toggleSound() {
  const current = isSoundEnabled()
  storage.set('sound_enabled', !current)
  return !current
}

function toggleMusic() {
  const current = isMusicEnabled()
  const next = !current
  storage.set('music_enabled', next)

  try {
    if (next) {
      play('ambient')
    } else {
      const ambient = sounds.ambient
      if (ambient) {
        ambient.stop()
      }
    }
  } catch {
    // Silently fail
  }

  return next
}

export function initSoundManager() {
  if (soundListenerRegistered) return;
  soundListenerRegistered = true;
  eventBus.on('sound:play', (e) => play(e.detail.sound));
}

export function destroySoundManager() {
  soundListenerRegistered = false;
  // Note: eventBus doesn't support removeListener by reference easily,
  // but the flag prevents re-registration
}

// Auto-init on first import
initSoundManager();

export default {
  play,
  toggleSound,
  toggleMusic,
  isSoundEnabled,
  isMusicEnabled,
}
