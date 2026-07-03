import { IonIcon } from "@ionic/react";
import {
  addOutline,
  alertCircleOutline,
  analyticsOutline,
  arrowBackOutline,
  arrowForwardOutline,
  bookOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  chevronForwardOutline,
  closeCircleOutline,
  closeOutline,
  copyOutline,
  cloudUploadOutline,
  createOutline,
  downloadOutline,
  ellipsisVertical,
  eyeOutline,
  fileTrayFullOutline,
  flaskOutline,
  folderOpenOutline,
  hardwareChipOutline,
  helpCircleOutline,
  homeOutline,
  informationCircleOutline,
  menuOutline,
  moveOutline,
  pauseOutline,
  playOutline,
  refreshOutline,
  repeatOutline,
  saveOutline,
  schoolOutline,
  searchOutline,
  settingsOutline,
  statsChartOutline,
  stopwatchOutline,
  syncOutline,
  timeOutline,
  trashOutline,
  trendingUpOutline,
  warningOutline,
} from "ionicons/icons";

const icons = {
  add: addOutline,
  alert: alertCircleOutline,
  analytics: analyticsOutline,
  back: arrowBackOutline,
  forward: arrowForwardOutline,
  book: bookOutline,
  check: checkmarkCircleOutline,
  "chevron-down": chevronDownOutline,
  "chevron-forward": chevronForwardOutline,
  close: closeOutline,
  "close-circle": closeCircleOutline,
  copy: copyOutline,
  upload: cloudUploadOutline,
  edit: createOutline,
  download: downloadOutline,
  more: ellipsisVertical,
  eye: eyeOutline,
  files: fileTrayFullOutline,
  flask: flaskOutline,
  folder: folderOpenOutline,
  "hardware-chip": hardwareChipOutline,
  help: helpCircleOutline,
  home: homeOutline,
  info: informationCircleOutline,
  menu: menuOutline,
  move: moveOutline,
  pause: pauseOutline,
  play: playOutline,
  refresh: refreshOutline,
  repeat: repeatOutline,
  save: saveOutline,
  school: schoolOutline,
  search: searchOutline,
  settings: settingsOutline,
  stats: statsChartOutline,
  stopwatch: stopwatchOutline,
  sync: syncOutline,
  time: timeOutline,
  trash: trashOutline,
  "trending-up": trendingUpOutline,
  warning: warningOutline,
};

export type AppIconName = keyof typeof icons;

type AppIconProps = {
  name: AppIconName;
  className?: string;
  "aria-hidden"?: boolean;
};

export function AppIcon({
  name,
  className = "text-2xl",
  "aria-hidden": ariaHidden = true,
}: AppIconProps) {
  return (
    <IonIcon
      aria-hidden={ariaHidden ? "true" : undefined}
      className={className}
      icon={icons[name]}
    />
  );
}
