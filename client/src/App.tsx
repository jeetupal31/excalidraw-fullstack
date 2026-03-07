import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useParams } from "react-router-dom";
import { CursorLayer } from "./components/CursorLayer";
import { PresencePanel } from "./components/PresencePanel";
import { useRoom } from "./hooks/useRoom";

function App() {
  const { roomId = "default" } = useParams();

  const {
    users,
    remoteCursors,
    registerExcalidrawApi,
    handleSceneChange,
    handlePointerMove,
    handlePointerLeave,
  } = useRoom(roomId);

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Excalidraw excalidrawAPI={registerExcalidrawApi} onChange={handleSceneChange} />
      <CursorLayer cursors={remoteCursors} />
      <PresencePanel users={users} />
    </main>
  );
}

export default App;
