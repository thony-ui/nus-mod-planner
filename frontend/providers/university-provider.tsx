"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { University } from "@/types/module";

interface UniversityContextType {
  university: University;
  setUniversity: (uni: University) => void;
}

const UniversityContext = createContext<UniversityContextType | undefined>(
  undefined
);

export function UniversityProvider({ children }: { children: ReactNode }) {
  const [university, setUniversity] = useState<University>("NUS");

  return (
    <UniversityContext.Provider value={{ university, setUniversity }}>
      {children}
    </UniversityContext.Provider>
  );
}

export function useUniversity() {
  const context = useContext(UniversityContext);
  if (context === undefined) {
    throw new Error("useUniversity must be used within a UniversityProvider");
  }
  return context;
}
