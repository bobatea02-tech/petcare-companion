# Audio Feedback Sounds

This directory contains audio files for the JoJo Voice Assistant feedback sounds.

## Required Files

- `chime.mp3` - Wake word detection sound (short, pleasant chime)
- `success.mp3` - Command accepted sound (positive confirmation)
- `error.mp3` - Error sound (gentle error indication)
- `thinking.mp3` - Processing sound (subtle thinking indicator)

## Specifications

- **Format**: MP3 (for broad browser compatibility)
- **Duration**: 200-500ms (short and non-intrusive)
- **Volume**: Normalized to -3dB to prevent clipping
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128kbps minimum

## Fallback Behavior

If audio files are not present, the AudioFeedbackController will automatically generate simple tones using the Web Audio API as a fallback.

## Licensing

Ensure all audio files are properly licensed for use in the application. Consider using:
- Royalty-free sound libraries
- Creative Commons licensed sounds
- Custom-generated sounds

## Sources

Recommended sources for feedback sounds:
- [Freesound.org](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [SoundBible](http://soundbible.com/)
- Custom generation with tools like Audacity or GarageBand
