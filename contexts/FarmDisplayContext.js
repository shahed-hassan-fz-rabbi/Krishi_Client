"use client";
import { createContext, useContext, useState } from "react";

const FarmDisplayContext = createContext({ record: null, setRecord: () => {} });

/** Temporary header display only; never writes profile or district preferences. */
export function FarmDisplayProvider({ children }) {
  const [record, setRecord] = useState(null);
  return <FarmDisplayContext.Provider value={{ record, setRecord }}>{children}</FarmDisplayContext.Provider>;
}

export const useFarmDisplay = () => useContext(FarmDisplayContext);
