import { Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";

function App() {
  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
