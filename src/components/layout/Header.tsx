import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RainbowText } from "@/components/RainbowText";
import { CategoryNav } from "./CategoryNav";

export function Header() {
  return (
    <header className="bg-background sticky top-0 z-50 select-none">
      <div className="border-border border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <RainbowText className="text-xl">Awesome LED List</RainbowText>
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
            <ThemeToggle />
          </nav>
        </div>
      </div>
      <CategoryNav />
    </header>
  );
}
