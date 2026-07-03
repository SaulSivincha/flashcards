import { useEffect } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Flashcard } from "../../components/study/Flashcard";
import { StudyActionBar } from "../../components/study/StudyActionBar";
import { StudyProgress } from "../../components/study/StudyProgress";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { useSettingsStore } from "../../stores/settingsStore";
import { useStudyStore } from "../../stores/studyStore";
import { telemetryService } from "../../services/telemetry/telemetryService";

type StudyQuestionLocationState = {
  returningFromAnswer?: boolean;
};

export function StudyQuestionPage() {
  const history = useHistory();
  const location = useLocation<StudyQuestionLocationState>();
  const { topicId } = useParams<{ topicId: string }>();
  const snapshot = useStudyStore((state) => state.snapshot);
  const topic = useStudyStore((state) => state.topic);
  const isLoading = useStudyStore((state) => state.isLoading);
  const error = useStudyStore((state) => state.error);
  const begin = useStudyStore((state) => state.begin);
  const settings = useSettingsStore((state) => state.settings);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const forceNew = query.get("new") === "1";
    const category = query.get("category") ?? undefined;
    const order = query.get("order");
    const shuffle =
      order === "random" ||
      (!order && settings?.defaultStudyOrder === "random");
    const canReuseSession =
      location.state?.returningFromAnswer === true &&
      snapshot?.session.topicId === topicId &&
      snapshot.session.mode === "review" &&
      Boolean(topic);

    if (canReuseSession) {
      return;
    }

    void begin(topicId, "review", { category, shuffle, forceNew })
      .then(() => {
        if (forceNew) {
          history.replace(`/estudio/${topicId}`);
        }
      })
      .catch(() => undefined);
  }, [
    begin,
    history,
    location.search,
    location.state,
    settings?.defaultStudyOrder,
    snapshot?.session.mode,
    snapshot?.session.topicId,
    topic,
    topicId,
  ]);

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

  useEffect(() => {
    if (!currentCard || !session || !pass) {
      return;
    }
    void telemetryService.presentCard({
      studySessionId: session.id,
      passId: pass.id,
      cardId: currentCard.id,
      mode: session.mode,
      passNumber: pass.passNumber,
      presentationNumber: (session.currentCardIndex ?? 0) + 1,
      resumed: location.state?.returningFromAnswer === true,
    });
  }, [
    currentCard,
    location.state,
    pass,
    session,
  ]);

  if (isLoading || !snapshot || !topic) {
    return (
      <ScreenContainer className="!bg-paper" focused>
        <div className="flex min-h-[70vh] items-center justify-center text-center">
          <div>
            <p className="text-xl font-semibold">
              {error ? "No se pudo iniciar el estudio" : "Preparando sesión…"}
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

  const current = (session.currentCardIndex ?? 0) + 1;
  const pauseStudy = () => {
    void telemetryService.recordStudyEvent({
      type: "study_paused",
      topicId,
      studySessionId: session.id,
      cardId: currentCard.id,
    });
    history.push(`/temas/${topicId}`);
  };
  const revealAnswer = () => {
    void telemetryService.revealCard();
    history.push(`/estudio/${topicId}/respuesta`);
  };

  return (
    <ScreenContainer className="study-session-screen !bg-[#F5F3E7]" focused>
      <header className="sticky top-0 z-20 -mx-4 -mt-6 border-b border-black/5 bg-[#F5F3E7]/90 px-4 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur-md">
        <div className="mb-4 flex min-h-12 items-center justify-between">
          <IconButton
            icon="close"
            label="Cerrar sesión"
            onClick={pauseStudy}
          />
          <h1 className="line-clamp-1 min-w-0 flex-1 px-4 text-center text-xl font-semibold text-ink">
            {topic.title}
          </h1>
          <IconButton
            icon="pause"
            label="Pausar sesión"
            onClick={pauseStudy}
          />
        </div>
        <StudyProgress
          current={current}
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
        initialSide={
          location.state?.returningFromAnswer ? "answer" : "question"
        }
        onFlip={
          settings?.flipCardOnTap === false
            ? undefined
            : revealAnswer
        }
        question={currentCard.question}
        side="question"
      />
      <StudyActionBar
        answerVisible={false}
        onReveal={revealAnswer}
      />
      <button
        className="mt-3 min-h-12 w-full text-sm font-semibold text-slate/70 transition-colors hover:text-ink"
        onClick={pauseStudy}
        type="button"
      >
        Terminar repaso
      </button>
    </ScreenContainer>
  );
}
