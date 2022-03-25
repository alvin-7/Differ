
export interface IElectronAPI {
  ipcRenderer: any,
  readXlsx: (path: string) => any[],
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
