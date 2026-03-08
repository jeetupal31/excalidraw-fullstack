import type { CSSProperties } from "react";
import type { PresenceUsers } from "../types/collaboration";

interface PresencePanelProps {
  users: PresenceUsers;
}

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 16,
  right: 16,
  minWidth: 180,
  background: "rgba(255, 255, 255, 0.95)",
  border: "1px solid #d9e2ec",
  borderRadius: 10,
  padding: 12,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
  zIndex: 10,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
};

const userListStyle: CSSProperties = {
  marginTop: 8,
  display: "grid",
  gap: 6,
};

const userItemStyle: CSSProperties = {
  fontSize: 13,
  color: "#334155",
};

export function PresencePanel({ users }: PresencePanelProps) {
  const userNames = Object.values(users);

  return (
    <aside style={panelStyle}>
      <h2 style={titleStyle}>Active Users ({userNames.length})</h2>
      <div style={userListStyle}>
        {userNames.length === 0 ? (
          <span style={userItemStyle}>Waiting for collaborators...</span>
        ) : (
          userNames.map((name) => (
            <span key={name} style={userItemStyle}>
              - {name}
            </span>
          ))
        )}
      </div>
    </aside>
  );
}
