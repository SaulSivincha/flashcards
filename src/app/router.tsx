import { IonRouterOutlet } from "@ionic/react";
import { Redirect, Route, Switch } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { CourseDetailPage } from "../features/courses/CourseDetailPage";
import { CoursesPage } from "../features/courses/CoursesPage";
import { HomePage } from "../features/home/HomePage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { ExamModePage } from "../features/study/ExamModePage";
import { PassResultPage } from "../features/study/PassResultPage";
import { SessionSummaryPage } from "../features/study/SessionSummaryPage";
import { StudyAnswerPage } from "../features/study/StudyAnswerPage";
import { StudyQuestionPage } from "../features/study/StudyQuestionPage";
import { StatsPage } from "../features/stats/StatsPage";
import { TopicStatsPage } from "../features/stats/TopicStatsPage";
import { ImportCsvPage } from "../features/topics/ImportCsvPage";
import { TopicDetailPage } from "../features/topics/TopicDetailPage";

export function AppRouter() {
  return (
    <AppShell>
      <IonRouterOutlet animated={false}>
        <Switch>
          <Route component={HomePage} exact path="/inicio" />
          <Route component={CoursesPage} exact path="/cursos" />
          <Route component={ImportCsvPage} exact path="/cursos/:courseId/importar" />
          <Route component={CourseDetailPage} exact path="/cursos/:courseId" />
          <Route component={TopicDetailPage} exact path="/temas/:topicId" />
          <Route
            component={StudyAnswerPage}
            exact
            path="/estudio/:topicId/respuesta"
          />
          <Route
            component={PassResultPage}
            exact
            path="/estudio/:topicId/resultado-pasada"
          />
          <Route
            component={SessionSummaryPage}
            exact
            path="/estudio/:topicId/resumen"
          />
          <Route component={StudyQuestionPage} exact path="/estudio/:topicId" />
          <Route component={ExamModePage} exact path="/examen/:topicId" />
          <Route
            component={TopicStatsPage}
            exact
            path="/estadisticas/temas/:topicId"
          />
          <Route component={StatsPage} exact path="/estadisticas" />
          <Route component={SettingsPage} exact path="/configuracion" />
          <Redirect exact from="/" to="/inicio" />
          <Redirect to="/inicio" />
        </Switch>
      </IonRouterOutlet>
    </AppShell>
  );
}
