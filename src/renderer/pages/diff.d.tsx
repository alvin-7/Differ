import { IpcRenderer } from 'electron';

export interface IElectronAPI {
  ipcRenderer: IpcRenderer,
  readXlsx: (path: string|ArrayBuffer) => any[],
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
