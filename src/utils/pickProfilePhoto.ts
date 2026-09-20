import { Platform } from 'react-native';

/**
 * Opens the browser's native file picker (works for the device's photo
 * gallery, its file browser, or macOS Finder — that choice is entirely the
 * OS's file-picker UI, nothing Moien controls) and resolves with a small,
 * square JPEG data URL downsized client-side via canvas, or `null` if the
 * environment can't do this (non-web). The whole app only ships to web
 * today (see AGENTS.md / firebaseConfig.ts's own web-only branches), so no
 * native image-picker dependency is pulled in for a path that never runs.
 *
 * If the user cancels the OS file dialog without choosing a file, no
 * 'change' event fires and this promise simply never settles — there's no
 * reliable cross-browser cancel event on `<input type="file">`, so the
 * caller just never proceeds past "waiting for a photo," which is a
 * correct (if silent) outcome, not a bug.
 */
export function pickAndResizeProfilePhoto(targetSize = 256, quality = 0.82): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('profile-photo-read-failed'));
      reader.onload = () => {
        const img = new window.Image();
        img.onerror = () => reject(new Error('profile-photo-decode-failed'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('profile-photo-canvas-unavailable'));
            return;
          }
          // Center-crop to a square before scaling, so a wide/tall photo
          // doesn't get squashed into the round avatar.
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, 0, 0, targetSize, targetSize);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    };

    document.body.appendChild(input);
    input.click();
  });
}
