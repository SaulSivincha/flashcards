import { useRef, useState, type DragEvent } from "react";
import { useHistory, useParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
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

export function ImportCsvPage() {
  const history = useHistory();
  const { courseId } = useParams<{ courseId: string }>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [analysis, setAnalysis] = useState<CsvImportAnalysis>();
  const [issues, setIssues] = useState<CsvValidationIssue[]>([]);
  const [genericError, setGenericError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const loadCourses = useCourseStore((state) => state.loadCourses);
  const loadByCourse = useTopicStore((state) => state.loadByCourse);
  const loadRecent = useTopicStore((state) => state.loadRecent);
  const activeStep = status === "idle" || status === "parsing" ? 1 : 2;

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

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setDragActive(false);
    void handleFile(event.dataTransfer.files[0]);
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
          Selecciona un CSV con metadatos de curso, unidad y tema.
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
          o arrástralo aquí desde tu dispositivo
        </span>
        <input
          accept=".csv,text/csv"
          className="sr-only"
          disabled={status === "parsing" || status === "importing"}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
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
            Seleccionar otro archivo
          </Button>
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
        <Button onClick={() => history.goBack()} variant="secondary">
          Cancelar
        </Button>
      </div>
    </ScreenContainer>
  );
}
