import { useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Flashcard } from "../../components/study/Flashcard";
import { StudyActionBar } from "../../components/study/StudyActionBar";
import { StudyProgress } from "../../components/study/StudyProgress";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { useSettingsStore } from "../../stores/settingsStore";
import { useStudyStore } from "../../stores/studyStore";
import type { AttemptResult } from "../../types/study";

export function StudyAnswerPage() {
  const history = useHistory();
  const { topicId } = useParams<{ topicId: string }>();
  const snapshot = useStudyStore((state) => state.snapshot);
  const topic = useStudyStore((state) => state.topic);
  const isLoading = useStudyStore((state) => state.isLoading);
  const isSubmitting = useStudyStore((state) => state.isSubmitting);
  const error = useStudyStore((state) => state.error);
  const begin = useStudyStore((state) => state.begin);
  const answer = useStudyStore((state) => state.answer);
  const settings = useSettingsStore((state) => state.settings);

  useEffect(() => {
    if (
      snapshot?.session.topicId !== topicId ||
      snapshot?.session.mode !== "review" ||
      !topic
    ) {
      void begin(topicId, "review").catch(() => undefined);
    }
  }, [
    begin,
    snapshot?.session.mode,
    snapshot?.session.topicId,
    topic,
    topicId,
  ]);

  async function handleAnswer(result: AttemptResult): Promise<void> {
    if (isSubmitting) {
      return;
    }
    const outcome = await answer(result);
    if (outcome.sessionCompleted) {
      history.replace(`/estudio/${topicId}/resumen`);
    } else if (outcome.passCompleted) {
      history.replace(`/estudio/${topicId}/resultado-pasada`);
    } else {
      history.replace(`/estudio/${topicId}`);
    }
  }

  const currentCard = snapshot?.currentCard;
  const session = snapshot?.session;
  const pass = snapshot?.pass;

  useEffect(() => {
    if (!isLoading && session && !currentCard) {
      history.replace(
        session.finishedAt
          ? `/estudio/${topicId}/resumen`
          : `/estudio/${topicId}/resultado-pasada`,
      );
    }
  }, [currentCard, history, isLoading, session, topicId]);

  if (isLoading || !snapshot || !topic) {
    return (
      <ScreenContainer className="!bg-paper" focused>
        <div className="flex min-h-[70vh] items-center justify-center text-center">
          <div>
            <p className="text-xl font-semibold">
              {error ? "No se pudo recuperar la sesión" : "Cargando respuesta…"}
            </p>
            {error ? <p className="mt-3 text-sm text-mahogany">{error}</p> : null}
            {error ? (
              <Button
                className="mt-6"
                onClick={() => history.replace(`/temas/${topicId}`)}
                variant="secondary"
              >
                Volver al tema
              </Button>
            ) : null}
          </div>
        </div>
      </ScreenContainer>
    );
  }

  if (!currentCard || !session || !pass) {
    return null;
  }

  return (
    <ScreenContainer className="study-session-screen !bg-[#F5F3E7]" focused>
      <header className="sticky top-0 z-20 -mx-4 -mt-6 border-b border-black/5 bg-[#F5F3E7]/90 px-4 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur-md">
        <div className="mb-4 flex min-h-12 items-center justify-between">
          <IconButton
            icon="close"
            label="Cerrar sesión"
            onClick={() => history.push(`/temas/${topicId}`)}
          />
          <h1 className="line-clamp-1 min-w-0 flex-1 px-4 text-center text-xl font-semibold text-ink">
            {topic.title}
          </h1>
          <IconButton
            icon="pause"
            label="Pausar sesión"
            onClick={() => history.push(`/temas/${topicId}`)}
          />
        </div>
        <StudyProgress
          current={(session.currentCardIndex ?? 0) + 1}
          pass={pass.passNumber}
          total={pass.totalCards}
        />
      </header>

      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate/10 bg-white/45 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate">
          <span className="h-1.5 w-1.5 rounded-full bg-slate" />
          {currentCard.category}
        </span>
      </div>
      <Flashcard
        answer={currentCard.answer}
        onFlip={
          settings?.flipCardOnTap === false
            ? undefined
            : () =>
                history.replace(`/estudio/${topicId}`, {
                  returningFromAnswer: true,
                })
        }
        question={currentCard.question}
        side="answer"
      />
      <fieldset disabled={isSubmitting}>
        <StudyActionBar
          answerVisible
          onCorrect={() => void handleAnswer("correct")}
          onIncorrect={() => void handleAnswer("incorrect")}
        />
      </fieldset>
      {error ? <p className="mt-3 text-center text-sm text-mahogany">{error}</p> : null}
    </ScreenContainer>
  );
}
