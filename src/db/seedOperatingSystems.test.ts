import operatingSystemsCsv from "../../cursos/Sistemas Operativos/Tema_01_Fundamentos_de_Sistemas_Operativos.csv?raw";
import operatingSystemsStructureCsv from "../../cursos/Sistemas Operativos/Tema_02_Estructura_de_Sistemas_Operativos.csv?raw";
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
