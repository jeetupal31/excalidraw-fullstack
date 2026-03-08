export type ClientIdentity = {
  clientId: string;
  username: string;
  color: string;
};

function randomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
}

export function setGuestName(name: string): void {
  sessionStorage.setItem("guest_name", name);
}

export function createClientIdentity(): ClientIdentity {
  const cachedName = sessionStorage.getItem("guest_name");
  
  return {
    clientId: Math.random().toString(36).slice(2),
    username: cachedName || `User-${Math.floor(Math.random() * 1000)}`,
    color: randomColor(),
  };
}
