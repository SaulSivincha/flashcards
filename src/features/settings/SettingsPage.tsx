import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon, type AppIconName } from "../../components/ui/AppIcon";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { readBackupFile } from "../../services/backup/backupService";
import {
  automaticSync,
  getAutomaticSyncDirectory,
  isAutomaticSyncAvailable,
  isAutomaticSyncEnabled,
  readSyncPackageFile,
  setAutomaticSyncEnabled,
} from "../../services/sync/syncService";
import { useDataManagementStore } from "../../stores/dataManagementStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { FlashStudyBackup } from "../../types/backup";
import type { FlashStudySyncPackage } from "../../types/sync";

const csvExample = `curso,Inteligencia Artificial
unidad,Unidad 1
tema,Sistemas expertos

categoria,pregunta,respuesta
Antecedentes históricos,¿Qué fue DENDRAL?,"Fue uno de los primeros sistemas expertos, desarrollado para identificar estructuras moleculares."`;

type ToggleProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
};

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={checked}
      className={`relative h-7 w-14 rounded-full transition-colors ${
        checked ? "bg-blaze" : "bg-slate/30"
      }`}
      onClick={onChange}
      type="button"
    >
      <span
        className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined) {
    return "No disponible";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 ** 2) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

type DataActionProps = {
  icon: AppIconName;
  label: string;
  detail?: string;
  disabled?: boolean;
  onClick: () => void;
};

function DataAction({
  icon,
  label,
  detail,
  disabled,
  onClick,
}: DataActionProps) {
  return (
    <button
      className="subtle-divider flex min-h-[88px] w-full items-center justify-between border-b px-6 text-left last:border-0 disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center gap-4">
        <AppIcon className="text-2xl text-slate" name={icon} />
        <span>
          <span className="block">{label}</span>
          {detail ? (
            <span className="muted-text mt-1 block text-xs">{detail}</span>
          ) : null}
        </span>
      </span>
      <AppIcon className="muted-text text-base" name="chevron-forward" />
    </button>
  );
}

export function SettingsPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const syncFileInput = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [automaticSyncEnabled, setAutomaticSyncEnabledState] = useState(
    isAutomaticSyncEnabled,
  );
  const [pendingBackup, setPendingBackup] = useState<FlashStudyBackup>();
  const [pendingSyncPackage, setPendingSyncPackage] =
    useState<FlashStudySyncPackage>();
  const settings = useSettingsStore((state) => state.settings);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setDefaultStudyOrder = useSettingsStore(
    (state) => state.setDefaultStudyOrder,
  );
  const setFlipCardOnTap = useSettingsStore(
    (state) => state.setFlipCardOnTap,
  );
  const storage = useDataManagementStore((state) => state.storage);
  const isBusy = useDataManagementStore((state) => state.isBusy);
  const message = useDataManagementStore((state) => state.message);
  const error = useDataManagementStore((state) => state.error);
  const loadStorage = useDataManagementStore((state) => state.loadStorage);
  const exportBackup = useDataManagementStore((state) => state.exportBackup);
  const exportSyncPackage = useDataManagementStore(
    (state) => state.exportSyncPackage,
  );
  const mergeSyncPackage = useDataManagementStore(
    (state) => state.mergeSyncPackage,
  );
  const restoreBackup = useDataManagementStore((state) => state.restoreBackup);
  const resetProgress = useDataManagementStore((state) => state.resetProgress);
  const clearFeedback = useDataManagementStore(
    (state) => state.clearFeedback,
  );
  const setDataError = useDataManagementStore((state) => state.setError);
  const darkMode = settings?.theme === "dark";
  const flip = settings?.flipCardOnTap ?? true;

  useEffect(() => {
    void loadStorage();
  }, [loadStorage]);

  async function handleBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    clearFeedback();
    try {
      setPendingBackup(await readBackupFile(file));
    } catch (fileError) {
      setDataError(
        fileError instanceof Error
          ? fileError.message
          : "No se pudo leer el respaldo seleccionado.",
      );
    }
  }

  async function handleSyncFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    clearFeedback();
    try {
      setPendingSyncPackage(await readSyncPackageFile(file));
    } catch (fileError) {
      setDataError(
        fileError instanceof Error
          ? fileError.message
          : "No se pudo leer el paquete de sincronización.",
      );
    }
  }

  async function confirmRestore() {
    if (!pendingBackup) {
      return;
    }
    try {
      await restoreBackup(pendingBackup);
      setPendingBackup(undefined);
    } catch {
      // El store mantiene el mensaje específico para mostrarlo en la pantalla.
    }
  }

  async function confirmReset() {
    try {
      await resetProgress();
      setResetOpen(false);
    } catch {
      // El store mantiene el mensaje específico para mostrarlo en la pantalla.
    }
  }

  async function confirmSyncMerge() {
    if (!pendingSyncPackage) {
      return;
    }
    try {
      await mergeSyncPackage(pendingSyncPackage);
      setPendingSyncPackage(undefined);
    } catch {
      // El store mantiene el mensaje específico para mostrarlo en la pantalla.
    }
  }

  async function toggleAutomaticSync(): Promise<void> {
    const enabled = !automaticSyncEnabled;
    setAutomaticSyncEnabled(enabled);
    setAutomaticSyncEnabledState(enabled);
    clearFeedback();
    if (enabled) {
      try {
        await automaticSync();
      } catch (syncError) {
        setDataError(
          syncError instanceof Error
            ? syncError.message
            : "No se pudo activar la sincronización automática.",
        );
      }
    }
  }

  const storageDetail = storage
    ? `${formatBytes(storage.backupBytes)} · ${storage.activeFlashcards} tarjetas activas`
    : "Calculando uso local…";

  return (
    <ScreenContainer>
      <h1 className="pt-5 text-[32px] font-bold">Configuración</h1>
      <p className="muted-text mt-1 text-base">Preferencias y datos locales</p>

      <section className="mt-8">
        <p className="mb-3 pl-1 text-sm font-medium uppercase tracking-[0.14em] text-slate">
          Apariencia
        </p>
        <div className="academic-card px-6 py-3">
          <div className="subtle-divider flex min-h-16 items-center justify-between border-b">
            <span>Modo oscuro</span>
            <Toggle
              checked={darkMode}
              label="Alternar modo oscuro"
              onChange={() => void setTheme(darkMode ? "light" : "dark")}
            />
          </div>
          <div className="flex min-h-20 items-center justify-between gap-4">
            <span>Tema</span>
            <div className="flex rounded-xl border border-[var(--fs-text)] p-1 text-xs font-semibold">
              {(["system", "light", "dark"] as const).map((theme) => (
                <button
                  className={`min-h-9 rounded-lg px-3 ${
                    settings?.theme === theme
                      ? "bg-blaze text-white"
                      : "muted-text"
                  }`}
                  key={theme}
                  onClick={() => void setTheme(theme)}
                  type="button"
                >
                  {theme === "system"
                    ? "Sistema"
                    : theme === "light"
                      ? "Claro"
                      : "Oscuro"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <p className="mb-3 pl-1 text-sm font-medium uppercase tracking-[0.14em] text-slate">
          Estudio
        </p>
        <div className="academic-card px-6 py-3">
          <div className="subtle-divider flex min-h-20 items-center justify-between gap-4 border-b">
            <span>Orden predeterminado</span>
            <div className="flex rounded-xl border border-[var(--fs-text)] p-1 text-xs font-semibold">
              <button
                className={`min-h-9 rounded-lg px-4 ${
                  settings?.defaultStudyOrder === "normal"
                    ? "bg-slate/30"
                    : "muted-text"
                }`}
                onClick={() => void setDefaultStudyOrder("normal")}
                type="button"
              >
                Normal
              </button>
              <button
                className={`min-h-9 rounded-lg px-4 ${
                  settings?.defaultStudyOrder === "random"
                    ? "bg-slate/30"
                    : "muted-text"
                }`}
                onClick={() => void setDefaultStudyOrder("random")}
                type="button"
              >
                Aleatorio
              </button>
            </div>
          </div>
          <div className="flex min-h-20 items-center justify-between">
            <span>Voltear tarjeta al tocar</span>
            <Toggle
              checked={flip}
              label="Alternar giro de tarjeta"
              onChange={() => void setFlipCardOnTap(!flip)}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <p className="mb-3 pl-1 text-sm font-medium uppercase tracking-[0.14em] text-slate">
          Datos locales
        </p>
        <div className="academic-card overflow-hidden">
          {isAutomaticSyncAvailable() ? (
            <div className="subtle-divider flex min-h-[88px] items-center justify-between border-b px-6">
              <span className="flex items-center gap-4">
                <AppIcon className="text-2xl text-slate" name="sync" />
                <span>
                  <span className="block">Sincronización automática</span>
                  <span className="muted-text mt-1 block text-xs">
                    {getAutomaticSyncDirectory()}
                  </span>
                </span>
              </span>
              <Toggle
                checked={automaticSyncEnabled}
                label="Alternar sincronización automática"
                onChange={() => void toggleAutomaticSync()}
              />
            </div>
          ) : null}
          <DataAction
            disabled={isBusy}
            icon="download"
            label="Exportar progreso (JSON)"
            onClick={() => void exportBackup()}
          />
          <DataAction
            disabled={isBusy}
            icon="download"
            label="Exportar paquete sync"
            onClick={() => void exportSyncPackage()}
          />
          <DataAction
            disabled={isBusy}
            icon="refresh"
            label="Fusionar paquete sync"
            onClick={() => syncFileInput.current?.click()}
          />
          <DataAction
            disabled={isBusy}
            icon="refresh"
            label="Restaurar datos"
            onClick={() => fileInput.current?.click()}
          />
          <DataAction
            detail={storageDetail}
            disabled={isBusy}
            icon="files"
            label="Gestión de almacenamiento"
            onClick={() => {
              setStorageOpen(true);
              void loadStorage();
            }}
          />
        </div>
        <input
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => void handleBackupFile(event)}
          ref={fileInput}
          type="file"
        />
        <input
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => void handleSyncFile(event)}
          ref={syncFileInput}
          type="file"
        />
        <div className="subtle-divider muted-text mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm">
          <AppIcon className="mt-0.5 text-lg text-slate" name="info" />
          En Android, comparte {getAutomaticSyncDirectory()} con Syncthing. La
          app publica los cambios al salir y fusiona los archivos de otros
          dispositivos al abrir o regresar. Los botones manuales quedan como
          respaldo.
        </div>
        {message ? (
          <p
            aria-live="polite"
            className="mt-4 rounded-xl bg-slate/10 p-4 text-sm text-slate"
          >
            {message}
          </p>
        ) : null}
        {error ? (
          <p
            aria-live="assertive"
            className="mt-4 rounded-xl bg-mahogany/10 p-4 text-sm text-mahogany"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>

      <section className="academic-card mt-8 p-6">
        <button
          aria-expanded={csvOpen}
          className="flex min-h-12 w-full items-center justify-between text-left"
          onClick={() => setCsvOpen((open) => !open)}
          type="button"
        >
          <h2 className="font-semibold">Ver formato esperado (CSV)</h2>
          <AppIcon
            className={`text-2xl text-slate transition-transform ${
              csvOpen ? "rotate-180" : ""
            }`}
            name="chevron-down"
          />
        </button>
        {csvOpen ? (
          <pre className="mt-5 overflow-x-auto whitespace-pre-wrap rounded-xl border border-paper bg-ink p-4 text-xs leading-5 text-paper/80">
            {csvExample}
          </pre>
        ) : null}
      </section>

      <div className="mt-12 text-center">
        <p className="muted-text text-xs font-semibold">
          FlashStudy v1.0 local-first
        </p>
        <button
          className="mt-8 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-mahogany text-mahogany disabled:opacity-50"
          disabled={isBusy}
          onClick={() => {
            clearFeedback();
            setResetOpen(true);
          }}
          type="button"
        >
          <AppIcon name="warning" />
          Reiniciar todo el progreso
        </button>
      </div>

      <BottomSheet
        onClose={() => setStorageOpen(false)}
        open={storageOpen}
        title="Almacenamiento local"
      >
        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="muted-text">Cursos</dt>
            <dd className="font-semibold">{storage?.courses ?? "…"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="muted-text">Temas</dt>
            <dd className="font-semibold">{storage?.topics ?? "…"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="muted-text">Tarjetas activas</dt>
            <dd className="font-semibold">
              {storage
                ? `${storage.activeFlashcards} de ${storage.flashcards}`
                : "…"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="muted-text">Sesiones e intentos</dt>
            <dd className="font-semibold">
              {storage ? `${storage.sessions} · ${storage.attempts}` : "…"}
            </dd>
          </div>
          <div className="subtle-divider flex justify-between gap-4 border-t pt-4">
            <dt className="muted-text">Tamaño del respaldo</dt>
            <dd className="font-semibold">
              {formatBytes(storage?.backupBytes)}
            </dd>
          </div>
          {storage?.browserUsageBytes !== undefined ? (
            <div className="flex justify-between gap-4">
              <dt className="muted-text">Uso estimado del sitio</dt>
              <dd className="font-semibold">
                {formatBytes(storage.browserUsageBytes)}
              </dd>
            </div>
          ) : null}
        </dl>
        <Button className="mt-7" onClick={() => setStorageOpen(false)}>
          Cerrar
        </Button>
      </BottomSheet>

      <ConfirmDialog
        busy={isBusy}
        confirmLabel="Reiniciar"
        description="Se eliminarán las sesiones, pasadas, intentos y estadísticas. Tus cursos, temas, tarjetas, preferencias y orden se conservarán."
        onCancel={() => setResetOpen(false)}
        onConfirm={() => void confirmReset()}
        open={resetOpen}
        title="Reiniciar progreso"
      />

      <ConfirmDialog
        busy={isBusy}
        confirmLabel="Restaurar"
        description={
          pendingBackup
            ? `El respaldo contiene ${pendingBackup.data.courses.length} cursos, ${pendingBackup.data.topics.length} temas y ${pendingBackup.data.flashcards.length} tarjetas. Reemplazará los datos actuales.`
            : ""
        }
        onCancel={() => setPendingBackup(undefined)}
        onConfirm={() => void confirmRestore()}
        open={Boolean(pendingBackup)}
        title="Restaurar respaldo"
      />
      <ConfirmDialog
        busy={isBusy}
        confirmLabel="Fusionar"
        description={
          pendingSyncPackage
            ? `El paquete fue exportado el ${new Date(
                pendingSyncPackage.exportedAt,
              ).toLocaleString()} y se fusionará con los datos actuales sin reemplazarlos.`
            : ""
        }
        onCancel={() => setPendingSyncPackage(undefined)}
        onConfirm={() => void confirmSyncMerge()}
        open={Boolean(pendingSyncPackage)}
        title="Fusionar sincronización"
      />
    </ScreenContainer>
  );
}
