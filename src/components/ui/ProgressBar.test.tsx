import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("expone el porcentaje actual y limita valores fuera de rango", () => {
    const { rerender } = render(<ProgressBar value={68} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "68",
    );

    rerender(<ProgressBar value={150} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });
});
