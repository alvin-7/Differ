import { IpcRenderer } from 'electron';
import { ArrayChange } from 'diff';

export interface IElectronAPI {
  ipcRenderer: IpcRenderer;
  // readXlsx: (path: string|ArrayBuffer) => any[],
  readXlsx: (path: string | ArrayBuffer) => {
    [key: string]: [{ [key: string]: string }];
  } = {};

  /**
   * diffArrays.
   *
   *     "13": {
   *         "H": "1"   [update or add]
   *     },
   *     "14": {
   *         "C": "11"  [update or add]
   *     },
   *     "17": {
   *         "C": undefined  [remove]
   *     }
   *     "24": {
   *         "C": "1"   [update or add]
   *     }
   */
  diffArrays: (
    leftData: any[],
    rightData: any[]
  ) => {
    leftData: any[];
    rightData: any[];
    diffObj: { [key: number]: { [key: string]: string | undefined } };
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
