import operatingSystemsCsv from "../../cursos/Sistemas Operativos/Tema_01_Fundamentos_de_Sistemas_Operativos.csv?raw";
import operatingSystemsStructureCsv from "../../cursos/Sistemas Operativos/Tema_02_Estructura_de_Sistemas_Operativos.csv?raw";
import operatingSystemsProcessesCsv from "../../cursos/Sistemas Operativos/Tema_03_Procesos_Pesados_y_Livianos.csv?raw";
import { parseFlashcardCsv } from "../services/csv/csvParser";

describe("Tema 1 de Sistemas Operativos", () => {
  it("mantiene la respuesta correcta asociada a cada alternativa", () => {
    const parsed = parseFlashcardCsv(
      operatingSystemsCsv,
      "Tema_01_Fundamentos_de_Sistemas_Operativos.csv",
    );
    const resourceManager = parsed.cards.find(
      (card) =>
        card.question ===
        "¿Qué actividad corresponde al SO como gestor de recursos?",
    );

    expect(resourceManager).toMatchObject({
      answer: "Administrar CPU memoria E/S y almacenamiento",
    });
    expect(resourceManager?.alternatives).toContain(
      "Administrar CPU memoria E/S y almacenamiento",
    );
    parsed.cards.forEach((card) => {
      expect(card.alternatives).toHaveLength(4);
      expect(
        card.alternatives?.filter(
          (alternative) => alternative === card.answer,
        ),
      ).toHaveLength(1);
    });
  });
});

describe("Tema 3 de Sistemas Operativos", () => {
  it("incluye alternativas únicas y respuestas asociadas al material", () => {
    const parsed = parseFlashcardCsv(
      operatingSystemsProcessesCsv,
      "Tema_03_Procesos_Pesados_y_Livianos.csv",
    );

    expect(parsed.cards).toHaveLength(33);
    expect(
      parsed.cards.find(
        (card) =>
          card.question ===
          "¿Qué diferencia esencial hay entre listo y bloqueado?",
      ),
    ).toMatchObject({
      answer: "Listo espera CPU y bloqueado espera un evento o recurso",
    });
    expect(
      parsed.cards.find(
        (card) =>
          card.question ===
          "¿Qué relación define al modelo uno a uno?",
      ),
    ).toMatchObject({
      answer: "Cada hilo de usuario corresponde a un hilo de kernel",
    });
    parsed.cards.forEach((card) => {
      expect(card.alternatives).toHaveLength(4);
      expect(new Set(card.alternatives).size).toBe(4);
      expect(
        card.alternatives?.filter(
          (alternative) => alternative === card.answer,
        ),
      ).toHaveLength(1);
    });
  });
});

describe("Tema 2 de Sistemas Operativos", () => {
  it("mantiene alternativas complejas con la respuesta correcta exacta", () => {
    const parsed = parseFlashcardCsv(
      operatingSystemsStructureCsv,
      "Tema_02_Estructura_de_Sistemas_Operativos.csv",
    );

    expect(parsed.cards).toHaveLength(32);
    expect(
      parsed.cards.find(
        (card) =>
          card.question ===
          "¿Qué distingue con precisión una llamada al sistema de una API?",
      ),
    ).toMatchObject({
      answer: "Una llamada al sistema cruza al núcleo para solicitar un servicio",
    });
    expect(
      parsed.cards.find(
        (card) =>
          card.question ===
          "¿Qué conjunto permanece típicamente dentro de un microkernel?",
      ),
    ).toMatchObject({
      answer:
        "Planificación espacios de direcciones comunicación e interrupciones básicas",
    });
    parsed.cards.forEach((card) => {
      expect(card.alternatives).toHaveLength(4);
      expect(new Set(card.alternatives).size).toBe(4);
      expect(
        card.alternatives?.filter(
          (alternative) => alternative === card.answer,
        ),
      ).toHaveLength(1);
    });
  });
});
