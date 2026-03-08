import { exportToBlob, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { downloadBlob, downloadTextFile } from "./download";

export async function exportBoardAsPng(
  excalidrawApi: ExcalidrawImperativeAPI,
  boardId: string
): Promise<void> {
  const appState = excalidrawApi.getAppState();
  const pngBlob = await exportToBlob({
    elements: excalidrawApi.getSceneElements(),
    files: excalidrawApi.getFiles(),
    appState: {
      exportBackground: true,
      viewBackgroundColor: appState.viewBackgroundColor,
    },
    mimeType: "image/png",
  });

  downloadBlob(pngBlob, `${boardId}.png`);
}

export function exportBoardAsJson(
  excalidrawApi: ExcalidrawImperativeAPI,
  boardId: string
): void {
  const jsonPayload = serializeAsJSON(
    excalidrawApi.getSceneElementsIncludingDeleted(),
    excalidrawApi.getAppState(),
    excalidrawApi.getFiles(),
    "local"
  );

  downloadTextFile(jsonPayload, `${boardId}.json`);
}
