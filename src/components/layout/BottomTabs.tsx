import { NavLink } from "react-router-dom";
import type { AppIconName } from "../ui/AppIcon";
import { AppIcon } from "../ui/AppIcon";

const tabs: Array<{ to: string; label: string; icon: AppIconName }> = [
  { to: "/inicio", label: "Inicio", icon: "home" },
  { to: "/cursos", label: "Cursos", icon: "book" },
  { to: "/estadisticas", label: "Estadísticas", icon: "stats" },
  { to: "/configuracion", label: "Configuración", icon: "settings" },
];

export function BottomTabs() {
  return (
    <nav className="safe-bottom fixed bottom-0 left-1/2 z-50 flex w-full max-w-[760px] -translate-x-1/2 items-center justify-around rounded-t-[18px] border-t subtle-divider bg-[var(--fs-nav)] px-2 py-2 shadow-[0_-4px_20px_rgba(10,18,42,0.06)]">
      {tabs.map((tab) => (
        <NavLink
          activeClassName="!bg-blaze/15 !text-blaze"
          className="flex min-h-14 min-w-[70px] flex-col items-center justify-center rounded-full px-3 text-[11px] font-medium text-[var(--fs-text-muted)] transition-colors"
          key={tab.to}
          to={tab.to}
        >
          <AppIcon className="mb-1 text-[25px]" name={tab.icon} />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
