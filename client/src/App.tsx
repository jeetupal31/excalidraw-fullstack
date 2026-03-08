import { Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";

function App() {
  return (
    <>
      <div className="bg-mesh-light" />
      <div className="relative flex min-h-screen w-full flex-col text-slate-900 dark:text-slate-50">
        <Navbar />
        <div className="relative z-10 flex w-full flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default App;
