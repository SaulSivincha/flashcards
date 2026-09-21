import { parseFlashcardCsv } from "./csvParser";
import { CsvValidationError } from "./csvTypes";

const validCsv = `curso,Inteligencia Artificial
unidad,Unidad 1
tema,Sistemas Basados en el Conocimiento

categoria,pregunta,respuesta
Historia,¿Qué fue DENDRAL?,"Fue un sistema experto, creado en Stanford."
Comparación,¿Datos o conocimiento?,"Los datos describen hechos; el conocimiento permite razonar."`;

function expectIssue(csv: string, code: string): void {
  try {
    parseFlashcardCsv(csv, "test.csv");
    throw new Error("Se esperaba un error de validación.");
  } catch (error) {
    expect(error).toBeInstanceOf(CsvValidationError);
    expect(
      (error as CsvValidationError).issues.some((issue) => issue.code === code),
    ).toBe(true);
  }
}

describe("parseFlashcardCsv", () => {
  it("parsea CSV válido con metadatos, comas y caracteres especiales", () => {
    const result = parseFlashcardCsv(validCsv, "IA_TEMA1.csv");

    expect(result.metadata).toEqual({
      course: "Inteligencia Artificial",
      unit: "Unidad 1",
      topic: "Sistemas Basados en el Conocimiento",
    });
    expect(result.cards).toHaveLength(2);
    expect(result.cards[0].answer).toContain("sistema experto, creado");
    expect(result.categories).toEqual(["Historia", "Comparación"]);
    expect(result.sourceHash).toMatch(/^[a-f0-9]{8}$/);
    expect(result.sourceText).toBe(validCsv);
  });

  it("acepta BOM, CRLF y encabezados con espacios", () => {
    const result = parseFlashcardCsv(
      "\uFEFF curso , IA \r\n tema , Tema 1 \r\n\r\n categoria , pregunta , respuesta \r\n General , ¿Qué? , Sí ",
    );

    expect(result.metadata.course).toBe("IA");
    expect(result.cards[0]).toMatchObject({
      category: "General",
      question: "¿Qué?",
      answer: "Sí",
    });
  });

  it("parsea tarjetas de cuatro alternativas sin afectar el formato anterior", () => {
    const result = parseFlashcardCsv(`curso,Curso
tema,Tema
categoria,pregunta,respuesta,alternativa 1,alternativa 2,alternativa 3,alternativa 4
General,¿Cuál es correcta?,Correcta,Incorrecta,Correcta,Otra,También incorrecta`);

    expect(result.cards[0]).toMatchObject({
      answer: "Correcta",
      alternatives: ["Incorrecta", "Correcta", "Otra", "También incorrecta"],
    });
  });

  it("detecta falta de curso", () => {
    expectIssue(
      `tema,Tema
categoria,pregunta,respuesta
General,Pregunta,Respuesta`,
      "MISSING_COURSE",
    );
  });

  it("detecta falta de tema", () => {
    expectIssue(
      `curso,Curso
categoria,pregunta,respuesta
General,Pregunta,Respuesta`,
      "MISSING_TOPIC",
    );
  });

  it("detecta falta del encabezado real", () => {
    expectIssue(
      `curso,Curso
tema,Tema
pregunta,respuesta
Pregunta,Respuesta`,
      "MISSING_HEADER",
    );
  });

  it("detecta pregunta vacía", () => {
    expectIssue(
      `curso,Curso
tema,Tema
categoria,pregunta,respuesta
General,,Respuesta`,
      "EMPTY_QUESTION",
    );
  });

  it("detecta respuesta vacía", () => {
    expectIssue(
      `curso,Curso
tema,Tema
categoria,pregunta,respuesta
General,Pregunta,`,
      "EMPTY_ANSWER",
    );
  });
});
