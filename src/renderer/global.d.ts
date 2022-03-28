import { IpcRenderer } from 'electron';
import { ArrayChange  } from 'diff';

export interface IElectronAPI {
  ipcRenderer: IpcRenderer,
  // readXlsx: (path: string|ArrayBuffer) => any[],
  readXlsx: (path: string|ArrayBuffer) => {[key: string]: [{[key:string]: string|number}]}={},
  diffArrays: (leftData: any[], rightData: any[]) => Array<ArrayChange<any>>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
