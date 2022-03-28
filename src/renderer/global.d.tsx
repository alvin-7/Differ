import { IpcRenderer } from 'electron';
import { WorkBook } from 'xlsx';

export interface IElectronAPI {
  ipcRenderer: IpcRenderer,
  // readXlsx: (path: string|ArrayBuffer) => any[],
  readXlsx: (path: string|ArrayBuffer) => WorkBook,
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
