import { useEffect, useRef, useState, type DragEvent } from "react";
import { useHistory, useParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import {
  analyzeCsvFile,
  importCsv,
} from "../../services/csv/csvImportService";
import type {
  CsvImportAnalysis,
  CsvImportMode,
} from "../../services/csv/csvImportTypes";
import {
  CsvValidationError,
  type CsvValidationIssue,
} from "../../services/csv/csvTypes";
import { useCourseStore } from "../../stores/courseStore";
import { useTopicStore } from "../../stores/topicStore";

type ImportStatus = "idle" | "parsing" | "ready" | "importing" | "error";

type BatchCsvItem = {
  fileName: string;
  analysis?: CsvImportAnalysis;
  issues: CsvValidationIssue[];
  error?: string;
};

const csvExample = `curso,Inteligencia Artificial
unidad,Unidad 1
tema,Sistemas Basados en el Conocimiento

categoria,pregunta,respuesta
Historia,¿Qué fue DENDRAL?,"Fue un sistema experto, creado en Stanford."
Comparación,¿Datos o conocimiento?,"Los datos describen hechos; el conocimiento permite razonar."`;

export function ImportCsvPage() {
  const history = useHistory();
  const { courseId } = useParams<{ courseId: string }>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [analysis, setAnalysis] = useState<CsvImportAnalysis>();
  const [batchItems, setBatchItems] = useState<BatchCsvItem[]>([]);
  const [issues, setIssues] = useState<CsvValidationIssue[]>([]);
  const [genericError, setGenericError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const loadCourses = useCourseStore((state) => state.loadCourses);
  const loadByCourse = useTopicStore((state) => state.loadByCourse);
  const loadRecent = useTopicStore((state) => state.loadRecent);
  const activeStep = status === "idle" || status === "parsing" ? 1 : 2;
  const validBatchItems = batchItems.filter((item) => item.analysis);
  const invalidBatchItems = batchItems.filter((item) => !item.analysis);
  const batchCardCount = validBatchItems.reduce(
    (total, item) => total + (item.analysis?.parsed.cards.length ?? 0),
    0,
  );

  async function handleFile(file?: File): Promise<void> {
    if (!file) {
      return;
    }

    if (!file.name.toLocaleLowerCase().endsWith(".csv")) {
      setAnalysis(undefined);
      setIssues([]);
      setGenericError("Selecciona un archivo con extensión .csv.");
      setStatus("error");
      return;
    }

    setStatus("parsing");
    setAnalysis(undefined);
    setBatchItems([]);
    setIssues([]);
    setGenericError("");

    try {
      const nextAnalysis = await analyzeCsvFile(file, courseId);
      setAnalysis(nextAnalysis);
      setStatus("ready");
    } catch (error) {
      if (error instanceof CsvValidationError) {
        setIssues(error.issues);
      } else {
        setGenericError(
          error instanceof Error
            ? error.message
            : "No se pudo analizar el archivo CSV.",
        );
      }
      setStatus("error");
    }
  }

  async function handleFiles(files: FileList | File[]): Promise<void> {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length === 1) {
      await handleFile(selectedFiles[0]);
      return;
    }

    setStatus("parsing");
    setAnalysis(undefined);
    setBatchItems([]);
    setIssues([]);
    setGenericError("");

    const nextItems = await Promise.all(
      selectedFiles.map(async (file): Promise<BatchCsvItem> => {
        if (!file.name.toLocaleLowerCase().endsWith(".csv")) {
          return {
            fileName: file.name,
            issues: [],
            error: "No tiene extensión .csv.",
          };
        }

        try {
          return {
            fileName: file.name,
            analysis: await analyzeCsvFile(file, courseId),
            issues: [],
          };
        } catch (error) {
          if (error instanceof CsvValidationError) {
            return {
              fileName: file.name,
              issues: error.issues,
            };
          }

          return {
            fileName: file.name,
            issues: [],
            error:
              error instanceof Error
                ? error.message
                : "No se pudo analizar el archivo CSV.",
          };
        }
      }),
    );

    setBatchItems(nextItems);
    setStatus(nextItems.some((item) => item.analysis) ? "ready" : "error");
    if (!nextItems.some((item) => item.analysis)) {
      setGenericError("No se pudo validar ningún CSV del lote.");
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setDragActive(false);
    void handleFiles(event.dataTransfer.files);
  }

  async function handleImport(mode: CsvImportMode): Promise<void> {
    if (!analysis) {
      return;
    }

    setStatus("importing");
    setGenericError("");
    try {
      const result = await importCsv(analysis, {
        mode,
        existingTopicId:
          mode === "update" ? analysis.conflict?.topicId : undefined,
      });
      await Promise.all([
        loadCourses(),
        loadByCourse(result.courseId),
        loadRecent(),
      ]);
      history.replace(`/temas/${result.topicId}`);
    } catch (error) {
      setGenericError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la importación.",
      );
      setStatus("error");
    }
  }

  async function handleBatchImport(): Promise<void> {
    if (validBatchItems.length === 0) {
      return;
    }

    setStatus("importing");
    setGenericError("");
    try {
      const results = [];
      for (const item of validBatchItems) {
        const itemAnalysis = item.analysis;
        if (!itemAnalysis) {
          continue;
        }

        results.push(
          await importCsv(itemAnalysis, {
            mode: itemAnalysis.conflict ? "update" : "create",
            existingTopicId: itemAnalysis.conflict?.topicId,
          }),
        );
      }

      const affectedCourseIds = new Set(results.map((result) => result.courseId));
      await Promise.all([
        loadCourses(),
        ...Array.from(affectedCourseIds).map((id) => loadByCourse(id)),
        loadRecent(),
      ]);
      history.replace(`/cursos/${courseId}`);
    } catch (error) {
      setGenericError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la importación por lote.",
      );
      setStatus("error");
    }
  }

  return (
    <ScreenContainer focused>
      <PageHeader back title="Importar CSV" />

      <div className="mb-9 flex items-center justify-center gap-2">
        {[1, 2, 3].map((step) => (
          <div className="flex items-center gap-2" key={step}>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                step <= activeStep
                  ? "bg-blaze text-white"
                  : "bg-slate/10 text-slate"
              }`}
            >
              {step}
            </span>
            {step < 3 ? <span className="h-px w-10 bg-slate/20" /> : null}
          </div>
        ))}
      </div>

      <section>
        <h1 className="text-[32px] font-bold leading-tight">Carga tu tema</h1>
        <p className="mt-3 muted-text">
          Selecciona uno o varios CSV con metadatos de curso, unidad y tema.
        </p>
      </section>

      <label
        className={`mt-8 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed bg-white p-6 text-center shadow-academic transition-colors ${
          dragActive ? "border-blaze bg-blaze/5" : "border-slate/35"
        }`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <AppIcon className="text-5xl text-slate" name="upload" />
        <strong className="mt-4">
          {status === "parsing" ? "Validando archivo…" : "Seleccionar archivo CSV"}
        </strong>
        <span className="mt-2 text-sm muted-text">
          o arrástralos aquí desde tu dispositivo
        </span>
        <input
          accept=".csv,text/csv"
          className="sr-only"
          disabled={status === "parsing" || status === "importing"}
          onChange={(event) => {
            if (event.target.files) {
              void handleFiles(event.target.files);
            }
            event.target.value = "";
          }}
          multiple
          ref={inputRef}
          type="file"
        />
      </label>

      {status === "error" ? (
        <Card className="mt-7 border border-mahogany/15">
          <div className="flex items-center gap-3 text-mahogany">
            <AppIcon className="text-2xl" name="alert" />
            <h2 className="font-semibold">Revisa el archivo</h2>
          </div>
          {genericError ? <p className="mt-4 text-sm">{genericError}</p> : null}
          {issues.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {issues.map((issue, index) => (
                <li
                  className="rounded-xl bg-mahogany/5 p-3 text-sm text-mahogany"
                  key={`${issue.code}-${issue.row ?? index}`}
                >
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            className="mt-6"
            onClick={() => inputRef.current?.click()}
            variant="secondary"
          >
            Seleccionar otros archivos
          </Button>
        </Card>
      ) : null}

      {batchItems.length > 0 ? (
        <Card className="mt-7">
          <div className="flex items-center gap-3 border-b subtle-divider pb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate/10 text-slate">
              <AppIcon name="files" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Lote de CSV validado</p>
              <p className="mt-1 text-xs muted-text">
                {validBatchItems.length} válidos, {invalidBatchItems.length} con
                errores, {batchCardCount} tarjetas
              </p>
            </div>
            <Chip tone={invalidBatchItems.length > 0 ? "orange" : "success"}>
              {validBatchItems.length} listos
            </Chip>
          </div>

          <div className="mt-5 divide-y subtle-divider">
            {batchItems.map((item) => {
              const itemAnalysis = item.analysis;
              return (
                <div className="py-4 first:pt-0 last:pb-0" key={item.fileName}>
                  <div className="flex items-start gap-3">
                    <AppIcon
                      className={`mt-0.5 text-xl ${
                        itemAnalysis ? "text-slate" : "text-mahogany"
                      }`}
                      name={itemAnalysis ? "check" : "alert"}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold">
                        {item.fileName}
                      </p>
                      {itemAnalysis ? (
                        <p className="mt-1 text-xs muted-text">
                          {itemAnalysis.parsed.metadata.topic} ·{" "}
                          {itemAnalysis.parsed.cards.length} tarjetas ·{" "}
                          {itemAnalysis.conflict
                            ? "actualizará tema existente"
                            : "creará tema nuevo"}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-mahogany">
                          {item.error ?? item.issues[0]?.message}
                        </p>
                      )}
                    </div>
                    {itemAnalysis ? <Chip tone="success">Válido</Chip> : null}
                  </div>
                </div>
              );
            })}
          </div>

          {invalidBatchItems.length > 0 ? (
            <div className="mt-5 rounded-xl bg-blaze/5 p-4 text-sm leading-6">
              Los archivos con errores no se importarán. Puedes corregirlos y
              volver a seleccionarlos sin afectar los CSV válidos.
            </div>
          ) : null}
        </Card>
      ) : null}

      {analysis ? (
        <>
          <Card className="mt-7">
            <div className="flex items-center gap-3 border-b subtle-divider pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate/10 text-slate">
                <AppIcon name="files" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-semibold">
                  {analysis.parsed.fileName}
                </p>
                <p className="mt-1 text-xs muted-text">
                  Archivo validado y listo para importar
                </p>
              </div>
              <Chip tone="success">Válido</Chip>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="muted-text">Curso detectado</dt>
                <dd className="text-right font-semibold">
                  {analysis.parsed.metadata.course}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="muted-text">Se guardará en</dt>
                <dd className="text-right font-semibold">
                  {analysis.targetCourseName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="muted-text">Unidad</dt>
                <dd className="font-semibold">
                  {analysis.parsed.metadata.unit || "Sin unidad"}
                </dd>
              </div>
              <div>
                <dt className="muted-text">Tema</dt>
                <dd className="mt-1 font-semibold">
                  {analysis.parsed.metadata.topic}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="muted-text">Tarjetas</dt>
                <dd className="font-semibold">{analysis.parsed.cards.length}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Chip>{analysis.parsed.categories.length} categorías</Chip>
              {analysis.parsed.categories.slice(0, 4).map((category) => (
                <Chip key={category}>{category}</Chip>
              ))}
            </div>
          </Card>

          {analysis.courseNameMismatch ? (
            <Card className="mt-5 border border-blaze/20 bg-blaze/5">
              <div className="flex items-start gap-3">
                <AppIcon className="mt-0.5 text-xl text-blaze" name="info" />
                <p className="text-sm leading-6">
                  El CSV indica “{analysis.parsed.metadata.course}”, pero se
                  importará dentro de “{analysis.targetCourseName}”.
                </p>
              </div>
            </Card>
          ) : null}

          {analysis.conflict ? (
            <Card className="mt-5 border border-blaze/20">
              <div className="flex items-start gap-3">
                <AppIcon className="mt-0.5 text-2xl text-blaze" name="refresh" />
                <div>
                  <h2 className="font-semibold">Este tema ya existe</h2>
                  <p className="mt-2 text-sm leading-6 muted-text">
                    Coincide por{" "}
                    {analysis.conflict.match === "fileName"
                      ? "nombre de archivo"
                      : "curso, unidad y tema"}
                    . Al actualizar se conservarán las estadísticas de preguntas
                    coincidentes.
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="mt-5">
            <h2 className="font-semibold">Vista previa</h2>
            <div className="mt-4 divide-y subtle-divider">
              {analysis.parsed.cards.slice(0, 3).map((card) => (
                <div className="py-4 first:pt-0 last:pb-0" key={card.sourceRow}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                    {card.category || "Sin categoría"}
                  </p>
                  <p className="mt-2 text-sm font-medium">{card.question}</p>
                  <p className="mt-1 line-clamp-1 text-xs muted-text">
                    {card.answer}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}

      <div className="mt-8 space-y-3">
        {analysis?.conflict ? (
          <>
            <Button
              disabled={status === "importing"}
              onClick={() => void handleImport("update")}
            >
              {status === "importing" ? "Actualizando…" : "Actualizar tema"}
            </Button>
            <Button
              disabled={status === "importing"}
              onClick={() => void handleImport("copy")}
              variant="secondary"
            >
              Importar como copia
            </Button>
          </>
        ) : analysis ? (
          <Button
            disabled={status === "importing"}
            onClick={() => void handleImport("create")}
          >
            {status === "importing"
              ? "Importando…"
              : "Confirmar importación"}
          </Button>
        ) : null}
        {batchItems.length > 0 && validBatchItems.length > 0 ? (
          <Button
            disabled={status === "importing"}
            onClick={() => void handleBatchImport()}
          >
            {status === "importing"
              ? "Importando lote…"
              : `Importar ${validBatchItems.length} CSV`}
          </Button>
        ) : null}
        <Button onClick={() => setExampleOpen(true)} variant="soft">
          <AppIcon name="help" />
          Ver ejemplo de CSV
        </Button>
        <Button onClick={() => history.goBack()} variant="cancel">
          Cancelar
        </Button>
      </div>

      <CsvExampleSheet
        onClose={() => setExampleOpen(false)}
        open={exampleOpen}
      />
    </ScreenContainer>
  );
}

type CsvExampleSheetProps = {
  open: boolean;
  onClose: () => void;
};

function CsvExampleSheet({ open, onClose }: CsvExampleSheetProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    if (open) {
      setCopyStatus("idle");
    }
  }, [open]);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(csvExample);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <BottomSheet onClose={onClose} open={open} title="Ejemplo de CSV">
      <div className="mt-7">
        <p className="text-sm leading-6 muted-text">
          Usa metadatos arriba y luego el encabezado obligatorio de tarjetas.
          Las respuestas con comas deben ir entre comillas.
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border subtle-divider bg-[var(--fs-surface-muted)]">
          <pre className="max-h-72 overflow-auto p-4 text-xs leading-5 text-[var(--fs-text)]">
            <code>{csvExample}</code>
          </pre>
        </div>

        {copyStatus === "copied" ? (
          <p className="mt-3 text-sm font-medium text-slate">
            Ejemplo copiado.
          </p>
        ) : null}
        {copyStatus === "error" ? (
          <p className="mt-3 text-sm font-medium text-mahogany">
            No se pudo copiar automáticamente.
          </p>
        ) : null}

        <div className="mt-10 space-y-3">
          <Button onClick={() => void handleCopy()}>
            <AppIcon name="copy" />
            Copiar ejemplo
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cerrar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
