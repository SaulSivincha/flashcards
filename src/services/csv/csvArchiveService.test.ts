import { buildArchivedCsvFileName } from "./csvArchiveService";

describe("buildArchivedCsvFileName", () => {
  it("conserva el nombre y agrega la fecha antes de la extensión", () => {
    const savedAt = new Date(2026, 5, 6, 15, 4, 9, 27);

    expect(buildArchivedCsvFileName("IA_TEMA1.csv", savedAt)).toBe(
      "IA_TEMA1_2026-06-06_15-04-09-027.csv",
    );
  });

  it("limpia caracteres que no son válidos en una ruta", () => {
    const savedAt = new Date(2026, 5, 6, 0, 0, 0, 0);

    expect(buildArchivedCsvFileName("tema/uno?.csv", savedAt)).toBe(
      "tema_uno__2026-06-06_00-00-00-000.csv",
    );
  });
});
