import React, { useEffect, useState } from "react";
import { Row, Col, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import {createPatch} from 'diff';
import {parse, html} from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import xlsx from 'node-xlsx';


const ExcelDiff = () => {

  const [sheetsSrc, setSheetsSrc] = useState([]);
  const [sheetsDiff, setSheetsDiff] = useState([]);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [diffHtml, setDiffHtml] = useState('');

  const SHEET_TYPE = {
    SRC: ['file_src', setSheetsSrc],
    DIFF: ['file_diff', setSheetsDiff]
  }

  const theme = 'auto'

  function getDiffStr(sheetsStr, sheetIdx) {
    let srcStr = ''
    const padLen = 20
    for (const line of sheetsStr[sheetIdx]?.data || []) {
      for (let s of line) {
        s = s ? `${s}` : ""
        let realLength = 0
        let realCut = 0
        for (let i = 0; i < s.length; i++) {
          const charCode = s.charCodeAt(i);
          if (charCode >= 0 && charCode <= 128) realLength += 1;
          else realLength += 2;
          if (realLength > padLen) {
            realCut = i-1
            break
          }
        }
        if (realLength > padLen) {
          srcStr += s.slice(0, realCut)
        } else {
          srcStr += s
          for (let i=0; i<padLen-realLength; i++)
            srcStr += ' '
        }
      }
      srcStr += '\n'
    }
    return srcStr
  }

  useEffect(() => {
    const srcStr = getDiffStr(sheetsSrc, sheetIdx)
    const diffStr = getDiffStr(sheetsDiff, sheetIdx)
    const patch = createPatch('', srcStr, diffStr, '', '', {context: 1000})
    const diffJson = parse(patch)
    const htmldraw = html(diffJson, { drawFileList: false, outputFormat: 'side-by-side'});
    setDiffHtml(htmldraw)
  }, [sheetsSrc, sheetsDiff, diffHtml, sheetIdx])

  const getFilds = (idName) =>{
    return () => {
      const filedom = document.getElementById(idName);
      filedom.click()
    }
  }

  const fileInputChange = (SetFunc) => {
    return (event) => {
      const fileData = event.target.files[0]
      const reader = new FileReader()
      reader.readAsArrayBuffer(fileData)
      reader.onload = function() {
        const excel_sheets = xlsx.parse(this.result)
        SetFunc(excel_sheets)
      }
    }
  }

  return (
    <React.Fragment>
      <Row gutter={10} wrap={false}>
        <Col span={12}>
          <input id={SHEET_TYPE.SRC[0]} type='file' accept=".xls,.xlsx" style={{display:'none'}} onChange={fileInputChange(SHEET_TYPE.SRC[1])}></input>
          <Button icon={<UploadOutlined />} onClick={getFilds(SHEET_TYPE.SRC[0])}>Click to Upload</Button>
        </Col>
        <Col span={12}>
          <input id={SHEET_TYPE.DIFF[0]} type='file' accept=".xls,.xlsx" style={{display:'none'}} onChange={fileInputChange(SHEET_TYPE.DIFF[1])}></input>
          <Button icon={<UploadOutlined />} onClick={getFilds(SHEET_TYPE.DIFF[0])}>Click to Upload</Button>
        </Col>
      </Row>
      <div className={`react-code-diff-lite ${theme}`}
        dangerouslySetInnerHTML={{__html: diffHtml}}>
      </div>
    </React.Fragment>
  );
}


export default ExcelDiff