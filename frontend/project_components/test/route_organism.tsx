"use client";

import { useState } from "react";
import RouteMolecule from "./route_molecule";

export default function RouteOrganism() {
  const [value, setValue] = useState("");

  return (
    <RouteMolecule
      value={value}
      onChange={setValue}
    />
  );
}
