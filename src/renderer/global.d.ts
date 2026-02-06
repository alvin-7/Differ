import { IpcRenderer } from 'electron';

export interface IElectronAPI {
  ipcRenderer: IpcRenderer;
  readXlsx: (path: string | ArrayBuffer) => {
    [key: string]: [{ [key: string]: string }];
  } = {};

  /**
   * Compares two arrays of row objects using Myers diff algorithm.
   * Returns aligned data with differences highlighted.
   *
   * @example
   * diffObj format:
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
    diffObj: { [key: number]: { [key: string]: boolean } };
    nullLines: {
      left: number[];
      right: number[];
    };
    rowTypes: { [key: number]: 'added' | 'removed' | 'modified' };
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
