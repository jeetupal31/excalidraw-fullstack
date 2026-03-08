export function downloadBlob(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Delay revocation to avoid races in slower browsers.
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 2000);
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType = "application/json"
): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}
