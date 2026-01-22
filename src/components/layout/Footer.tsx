export function Footer() {
  return (
    <footer className="border-border bg-muted/50 border-t py-6">
      <div className="container mx-auto px-4 text-center">
        <p className="text-muted-foreground text-sm">
          Awesome LED List is a community resource. Data is provided as-is with no guarantee of
          accuracy.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          <a
            href="https://github.com/yourusername/awesomeledlist"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline"
          >
            Contribute on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
