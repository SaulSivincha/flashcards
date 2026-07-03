import { useEffect, type PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { telemetryService } from "../../services/telemetry/telemetryService";
import { BottomTabs } from "./BottomTabs";

const focusedPrefixes = ["/estudio/", "/examen/"];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const hideTabs =
    focusedPrefixes.some((prefix) => location.pathname.startsWith(prefix)) ||
    location.pathname.endsWith("/importar");

  useEffect(() => {
    void telemetryService.recordRouteView(
      `${location.pathname}${location.search}`,
    );
  }, [location.pathname, location.search]);

  return (
    <>
      {children}
      {hideTabs ? null : <BottomTabs />}
    </>
  );
}
