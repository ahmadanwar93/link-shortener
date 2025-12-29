// import { Link } from "react-router-dom";
// import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">Link not found</h2>
        <p className="text-muted-foreground max-w-md">
          This short URL doesn't exist or has been removed.
        </p>
        {/* maybe add this when we do homepage */}
        {/* <Button asChild>
          <Link to="/">Go to Homepage</Link>
        </Button> */}
      </div>
    </div>
  );
}
