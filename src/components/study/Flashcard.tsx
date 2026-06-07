import { motion } from "framer-motion";
import { AppIcon } from "../ui/AppIcon";

type FlashcardProps = {
  side: "question" | "answer";
  initialSide?: "question" | "answer";
  question: string;
  answer: string;
  onFlip?: () => void;
};

export function Flashcard({
  side,
  initialSide = "question",
  question,
  answer,
  onFlip,
}: FlashcardProps) {
  const answerVisible = side === "answer";
  const answerInitiallyVisible = initialSide === "answer";

  return (
    <div className="my-6 [perspective:2000px]">
      <motion.button
        animate={{ rotateY: answerVisible ? 180 : 0 }}
        className="group relative min-h-[400px] w-full cursor-pointer [aspect-ratio:4/5] [transform-style:preserve-3d]"
        initial={{ rotateY: answerInitiallyVisible ? 180 : 0 }}
        onClick={onFlip}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        type="button"
      >
        <div className="absolute inset-0 flex flex-col rounded-[24px] border border-black/[0.03] bg-white p-8 text-left text-ink shadow-[0_20px_40px_-12px_rgba(10,18,42,0.10)] transition-shadow duration-300 [backface-visibility:hidden] group-hover:shadow-[0_30px_60px_-12px_rgba(10,18,42,0.15)]">
          <div className="flex-1">
            <div className="mb-6 flex items-center gap-2">
              <span className="h-px w-8 bg-blaze/30" />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-blaze">
                Pregunta
              </span>
            </div>
          <h2 className="text-[26px] font-bold leading-[1.3] tracking-[-0.02em] text-ink">
            {question}
          </h2>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 border-t border-black/5 pt-6 text-sm font-semibold text-slate/45">
            <AppIcon className="animate-pulse text-xl" name="eye" />
            Toca para revelar
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col rounded-[24px] border border-black/[0.03] bg-white p-8 text-left text-ink shadow-[0_20px_40px_-12px_rgba(10,18,42,0.10)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="min-h-0 flex-1 overflow-y-auto pr-2 study-scrollbar">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-px w-8 bg-slate/30" />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate">
                Respuesta
              </span>
            </div>
            <p className="text-[18px] leading-7 text-ink">{answer}</p>
          </div>
          <div className="mt-6 flex shrink-0 items-center justify-center gap-2 border-t border-black/5 pt-6 text-sm font-semibold text-slate/45">
            <AppIcon className="text-xl" name="sync" />
            Toca para volver a la pregunta
          </div>
        </div>
      </motion.button>
    </div>
  );
}
