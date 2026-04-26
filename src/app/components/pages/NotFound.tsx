import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2">404</h1>
        <p className="text-muted-foreground mb-4">Page not found</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
