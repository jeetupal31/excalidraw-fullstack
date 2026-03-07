import type { CSSProperties } from "react";
import type { RemoteCursors } from "../types/collaboration";

interface CursorLayerProps {
  cursors: RemoteCursors;
}

const cursorContainerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 5,
};

const dotStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
};

const labelStyle: CSSProperties = {
  marginTop: 4,
  padding: "2px 6px",
  borderRadius: 4,
  color: "#ffffff",
  fontSize: 12,
  whiteSpace: "nowrap",
};

export function CursorLayer({ cursors }: CursorLayerProps) {
  return (
    <div style={cursorContainerStyle}>
      {Object.entries(cursors).map(([clientId, cursor]) => (
        <div
          key={clientId}
          style={{
            position: "absolute",
            left: cursor.x,
            top: cursor.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              ...dotStyle,
              backgroundColor: cursor.color,
            }}
          />
          <div
            style={{
              ...labelStyle,
              backgroundColor: cursor.color,
            }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
}
