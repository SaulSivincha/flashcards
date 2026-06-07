import type { PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { BottomTabs } from "./BottomTabs";

const focusedPrefixes = ["/estudio/", "/examen/"];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const hideTabs =
    focusedPrefixes.some((prefix) => location.pathname.startsWith(prefix)) ||
    location.pathname.endsWith("/importar");

  return (
    <>
      {children}
      {hideTabs ? null : <BottomTabs />}
    </>
  );
}
