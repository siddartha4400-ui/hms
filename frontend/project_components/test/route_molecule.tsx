"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function RouteMolecule({ value, onChange }: Props) {
  return (
    <div className="test-container">
      <h2>/test</h2>
      <label className="d-block mb-2">
        Enter text:
        {/*
          Some browser extensions inject attributes into inputs (e.g. `fdprocessedid`) before
          React hydrates, which causes a hydration mismatch warning. We suppress hydration
          warnings for this input only to avoid noisy console errors while keeping the
          component behavior unchanged. Prefer disabling offending extensions in dev.
        */}
        <input
          aria-label="test-input"
          // suppress hydration mismatch warnings caused by DOM modifications from extensions
          suppressHydrationWarning
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-control mt-2"
        />
      </label>

      <div className="mt-3">
        <strong>Current value:</strong>
        <div className="value-box">{value || <em>(empty)</em>}</div>
      </div>
    </div>
  );
}
