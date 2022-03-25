import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Row, Col, Button, Radio } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import xlsx from 'node-xlsx';
import DiffComponent, { ReactDiffViewerStylesOverride } from 'react-diff-viewer';
import './diff.less'


interface SHEET_ITEM_TYPE {
  name: string,
  sheetSetter: SetterFunction<any[]>,
  titleSetter: SetterFunction<string>,
}

interface ExcelData {
  name: string,
  data: string[]
}

type SetterFunction<T> = Dispatch<SetStateAction<T>>

const ExcelDiff = () => {

  const [leftSheets, setLeftSheets] = useState([]);
  const [rightSheets, setRightSheets] = useState([]);
  const [leftTitle, setLeftTitle] = useState('');
  const [rightTitle, setRightTitle] = useState('');
  const [leftStr, setLeftStr] = useState('');
  const [rightStr, setRightStr] = useState('');
  const [sheetIdx, setSheetIdx] = useState('');
  const [sheetIdxs, setSheetIdxs] = useState([]);

  // let entryTryReadExcel = false;

  // if (!entryTryReadExcel) {
  //   entryTryReadExcel = true
  //   const sheets = window.electronAPI.readXlsx('')
  //   console.log(sheets)
  //   // const ipc = window?.electron?.ipcRenderer
  //   // ipc.invoke('ipc_excel_handle').then((sheets: Array<any>) => {
  //   //   if (!sheets?.length) return
  //   //   setLeftSheets(sheets[0])
  //   //   setRightSheets(sheets[1])
  //   // })
  // }


  const SHEET_TYPE: {[key: string]: SHEET_ITEM_TYPE} = {
    SRC: {
      name: 'file_src', 
      sheetSetter: setLeftSheets, 
      titleSetter: setLeftTitle
    },
    DIFF: {
      name: 'file_diff', 
      sheetSetter: setRightSheets, 
      titleSetter: setRightTitle
    }
  }

  function getDiffStr(sheetsStr: Array<ExcelData>, sheetIdx: string) {
    let diffString = ''
    const sheet = sheetsStr.find((c: ExcelData) => (c.name === sheetIdx))
    for (const line of sheet?.data || []) {
      if (line.length > 0) {
        diffString += line[0] ? line[0] : '&*'
        for (let i=1; i<line.length; i++) {
          const s = line[i] ? line[i] : '&*'
          diffString += '~' + s
        }
      } else {
        diffString += '&*'
      }
      diffString += '\n'
    }
    return diffString
  }


  useEffect(() => {
    const idxs = new Set<string>()
    for (const sheet of [...leftSheets, ...rightSheets]) {
      idxs.add(sheet.name)
    }
    setSheetIdxs(Array.from(idxs))
    if (!sheetIdx) {
      const idx = idxs.size ? idxs.keys().next().value : ''
      setSheetIdx(idx)
    }

    function refreshTable() {
      const left = getDiffStr(leftSheets, sheetIdx)
      const right = getDiffStr(rightSheets, sheetIdx)
      setLeftStr(left)
      setRightStr(right)
    }

    refreshTable()
  }, [sheetIdx, leftSheets, rightSheets])

  const getFilds = (idName: string) =>{
    return () => {
      const filedom = document.getElementById(idName);
      filedom.click()
    }
  }

  const fileInputChange = (setSheet: any, setTitle: any) => {
    return (event: any) => {
      const fileData = event.target.files[0]
      const reader = new FileReader()
      reader.readAsArrayBuffer(fileData)
      reader.onload = function() {
        const excel_sheets = xlsx.parse(this.result)
        setSheet(excel_sheets)
        setTitle(fileData.name)
      }
    }
  }

  const inputSyntax = (str: string) => {
    const strs = str ? str.split('~') : []
    let result = ""
    for (let s of strs) {
      if (!s) continue
      if (s === "&*") s = ''
      result += `<input type='text' class='diff_elem' readonly=true value='${s}'> </input>`
    }
    return (
      <pre
        style={{ display: 'inline' }}
        dangerouslySetInnerHTML={{
          __html: result
        }}
      />
    )
  };
  
  const indexChange = (e: any) => {
    setSheetIdx(e.target.value)
  }
  const styles: ReactDiffViewerStylesOverride  ={
    diffContainer: {
      overflowX: 'auto',
      // overflowX: "auto",
      // // maxWidth: 300
      // display: "block",
      // "& pre": { whiteSpace: "pre" },
    },
    diffRemoved: {
        overflowX: 'auto',
        maxWidth: 300,
    },
    diffAdded: {
        overflowX: 'auto',
        maxWidth: 300,
    },
  }

  return (
    <React.Fragment>
      {
        sheetIdx &&
        <Radio.Group defaultValue={sheetIdx} buttonStyle="solid" onChange={indexChange}>
          {
            sheetIdxs.map((element) =>
              <Radio.Button value={element} key={element}>{element}</Radio.Button>
            )
          }
        </Radio.Group>
      }
      <Row>
        <Col span={12}>
          <input id={SHEET_TYPE.SRC.name} type='file' accept=".xls,.xlsx" style={{display:'none'}} onChange={fileInputChange(SHEET_TYPE.SRC.sheetSetter, SHEET_TYPE.SRC.titleSetter)}></input>
          <Button icon={<UploadOutlined />} onClick={getFilds(SHEET_TYPE.SRC.name)}>Click to Upload</Button>
        </Col>
        <Col span={12}>
          <input id={SHEET_TYPE.DIFF.name} type='file' accept=".xls,.xlsx" style={{display:'none'}} onChange={fileInputChange(SHEET_TYPE.DIFF.sheetSetter, SHEET_TYPE.DIFF.titleSetter)}></input>
          <Button icon={<UploadOutlined />} onClick={getFilds(SHEET_TYPE.DIFF.name)}>Click to Upload</Button>
        </Col>
      </Row>
      {
        leftStr && <DiffComponent oldValue={leftStr} newValue={rightStr} splitView={true} leftTitle={leftTitle} rightTitle={rightTitle} 
        renderContent={inputSyntax} showDiffOnly={true} styles={styles}/>
      }
    </React.Fragment>
  );
}


export default ExcelDiff