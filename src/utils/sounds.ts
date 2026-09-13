import { createAudioPlayer } from 'expo-audio';

const correctPlayer = createAudioPlayer(require('../../assets/sounds/correct.wav'));
const wrongPlayer = createAudioPlayer(require('../../assets/sounds/wrong.wav'));
const completePlayer = createAudioPlayer(require('../../assets/sounds/complete.wav'));

function play(player: ReturnType<typeof createAudioPlayer>) {
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // Ignore playback errors (e.g. browser autoplay restrictions before any user interaction).
  }
}

export function playCorrect(): void {
  play(correctPlayer);
}

export function playWrong(): void {
  play(wrongPlayer);
}

export function playComplete(): void {
  play(completePlayer);
}
