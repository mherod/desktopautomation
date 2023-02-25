export interface DesktopWindow {
  processName: string;
  windowName: string;
  windowSize: string[];
  windowPosition: string[];
}

export interface DesktopProcess {
  processName: string;
  windows: DesktopWindow[];
}
