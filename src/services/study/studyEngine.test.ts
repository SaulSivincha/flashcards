import {
  answerCurrentCard,
  createInitialPass,
  createNextPass,
} from "./studyEngine";

describe("studyEngine", () => {
  it("incluye todas las tarjetas en la primera pasada", () => {
    const state = createInitialPass(["a", "b", "c"], false);

    expect(state.currentCardIds).toEqual(["a", "b", "c"]);
    expect(state.passNumber).toBe(1);
  });

  it("envía solo las incorrectas a la segunda pasada", () => {
    let state = createInitialPass(["a", "b", "c"], false);
    state = answerCurrentCard(state, "correct").state;
    state = answerCurrentCard(state, "incorrect").state;
    state = answerCurrentCard(state, "correct").state;

    const secondPass = createNextPass(state);

    expect(secondPass.currentCardIds).toEqual(["b"]);
    expect(secondPass.passNumber).toBe(2);
  });

  it("no repite las correctas en la siguiente pasada", () => {
    let state = createInitialPass(["a", "b"], false);
    state = answerCurrentCard(state, "correct").state;
    state = answerCurrentCard(state, "incorrect").state;

    expect(createNextPass(state).currentCardIds).not.toContain("a");
  });

  it("termina la sesión cuando no quedan incorrectas", () => {
    let state = createInitialPass(["a", "b"], false);
    state = answerCurrentCard(state, "correct").state;
    const result = answerCurrentCard(state, "correct");

    expect(result.passCompleted).toBe(true);
    expect(result.sessionCompleted).toBe(true);
  });
});
