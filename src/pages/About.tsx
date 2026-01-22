import { Link } from "react-router-dom";

export function About() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2 flex items-center gap-2">
        <Link to="/" className="text-muted-foreground hover:text-foreground text-sm">
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm">About</span>
      </div>

      <h1 className="mb-6 text-3xl font-bold">About Awesome LED List</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-lg">
          Awesome LED List is a community-maintained reference for the addressable LED ecosystem.
          Our goal is to help makers, installers, and enthusiasts find the right products for their
          projects.
        </p>

        <h2 className="mt-8 text-xl font-semibold">History</h2>
        <p>
          This project started as a Google Sheets document to organize information about LED
          controllers, pixels, and related products. As the community contributed more data, we
          decided to build a proper website to make the information more accessible and easier to
          browse.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Contributing</h2>
        <p>
          All data is stored in human-readable YAML files on GitHub. If you'd like to add or update
          information, you can submit a pull request to the repository.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Disclaimer</h2>
        <p>
          Information is provided "as-is" with no guarantee of accuracy. Product specifications may
          change, and we recommend verifying details with manufacturers before making purchasing
          decisions.
        </p>
      </div>
    </div>
  );
}
