import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="border-border bg-background sticky top-0 z-50 border-b">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">Awesome LED List</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <Link to="/about" className="text-muted-foreground hover:text-foreground text-sm">
            About
          </Link>
          <a
            href="https://github.com/cinderblock/awesomeledlist"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
