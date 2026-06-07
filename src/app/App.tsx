import { IonApp } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";

export function App() {
  return (
    <IonApp>
      <AppProviders>
        <IonReactRouter>
          <AppRouter />
        </IonReactRouter>
      </AppProviders>
    </IonApp>
  );
}
