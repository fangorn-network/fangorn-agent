import { FangornLogo } from "../../public/svg/fangorn-logo";

export default function FangornHeader() {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center p-1.5"
          style={{
            backgroundColor: "var(--color-black)",
            border: "1px solid var(--border)",
          }}
        >
          <FangornLogo />
        </div>
        <div>
          <h1
            className="text-lg font-medium"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            Explore
          </h1>
          <p
            className="text-xs"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            Browse for & discover data in the Fangorn Network
          </p>
        </div>
      </div>
    </header>
  );
}
