"use client";

import React, { useEffect } from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // With route groups the root layout is minimal; no need to toggle a body
  // class to hide header/sidebar/footer. This layout only centers the login
  // card and applies animation.
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-80 py-4">
      <div className="card shadow-sm w-100 max-w-420 mx-auto animate-fade-in-up">
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}
