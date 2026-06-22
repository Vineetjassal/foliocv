/**
 * Call this once when the React app is ready to be shown.
 * It snaps the progress bar to 100%, shows "Ready!", then
 * fades out and removes the loader overlay.
 */
export function dismissLoader(): void {
  if (typeof window !== 'undefined' && typeof (window as any).__folioLoaderDismiss === 'function') {
    (window as any).__folioLoaderDismiss();
  }
}
