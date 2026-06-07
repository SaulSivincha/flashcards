import type { PropsWithChildren } from "react";
import { IonContent, IonPage } from "@ionic/react";

type ScreenContainerProps = PropsWithChildren<{
  focused?: boolean;
  dark?: boolean;
  className?: string;
}>;

export function ScreenContainer({
  children,
  focused = false,
  dark = false,
  className = "",
}: ScreenContainerProps) {
  return (
    <IonPage>
      <IonContent fullscreen>
        <div
          className={`screen-frame ${dark ? "bg-ink text-paper" : ""} ${className}`}
        >
          <main
            className={`screen-content ${
              focused ? "screen-content--focused" : ""
            }`}
          >
            {children}
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
}
