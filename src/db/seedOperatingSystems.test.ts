import operatingSystemsCsv from "../../cursos/Sistemas Operativos/Tema_01_Fundamentos_de_Sistemas_Operativos.csv?raw";
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
