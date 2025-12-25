import { Outlet, Link } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-4">
        <Link to="/" className="text-xl font-bold text-foreground">
          Link Shortener
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {/* Outlet is react router slot for rendering nested route component. It is like children but for matched child routes */}
        <Outlet />
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground">
        © 2025 Link Shortener
      </footer>
    </div>
  );
}
