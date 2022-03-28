import { IpcRenderer } from 'electron';

export interface IElectronAPI {
  ipcRenderer: IpcRenderer,
  // readXlsx: (path: string|ArrayBuffer) => any[],
  readXlsx: (path: string|ArrayBuffer) => {[key: string]: [{[key:string]: string|number}]}={},
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
