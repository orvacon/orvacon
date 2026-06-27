export function SiteFooter() {
  return (
    <footer className="border-t px-6 py-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <p>
          Part of{" "}
          <a
            href="https://github.com/orvacon/orvacon"
            className="font-medium text-foreground hover:underline"
          >
            orvacon
          </a>{" "}
          — the open-source payment orchestration library.
        </p>
        <p>Components you own, copied in with the CLI.</p>
      </div>
    </footer>
  );
}
