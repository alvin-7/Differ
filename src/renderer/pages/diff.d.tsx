
export interface IElectronAPI {
  ipcRenderer: any,
  readXlsx: (path: string|ArrayBuffer) => any[],
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
