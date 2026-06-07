import { useHistory } from "react-router-dom";
import { IconButton } from "../ui/IconButton";

type PageHeaderProps = {
  title: string;
  back?: boolean;
  close?: boolean;
  more?: boolean;
  onClose?: () => void;
  dark?: boolean;
};

export function PageHeader({
  title,
  back = false,
  close = false,
  more = false,
  onClose,
  dark = false,
}: PageHeaderProps) {
  const history = useHistory();

  return (
    <header
      className={`sticky top-0 z-30 -mx-4 -mt-6 mb-8 flex min-h-16 items-center justify-between px-2 pt-[env(safe-area-inset-top)] backdrop-blur-md ${
        dark ? "bg-ink/95 text-paper" : "bg-[var(--fs-background-soft)]/95"
      }`}
    >
      {back || close ? (
        <IconButton
          icon={back ? "back" : "close"}
          label={back ? "Volver" : "Cerrar"}
          onClick={() => (onClose ? onClose() : history.goBack())}
        />
      ) : (
        <div className="h-12 w-12" />
      )}
      <h1 className="line-clamp-1 px-2 text-center text-xl font-semibold">
        {title}
      </h1>
      {more ? (
        <IconButton icon="more" label="Más opciones" />
      ) : (
        <div className="h-12 w-12" />
      )}
    </header>
  );
}
