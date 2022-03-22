import React, { useEffect, useState } from "react";
import { Row, Col, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
// import {createPatch} from 'diff';
// import {parse, html} from 'diff2html';
// import 'diff2html/bundles/css/diff2html.min.css';
import xlsx from 'node-xlsx';
import ReactDiffViewer from 'react-diff-viewer';
import './diff.less'


const ExcelDiff = () => {

  const [sheetsSrc, setSheetsSrc] = useState([]);
  const [sheetsDiff, setSheetsDiff] = useState([]);
  const [leftTitle, setLeftTitle] = useState('');
  const [rightTitle, setRightTitle] = useState('');
  const [strSrc, setStrSrc] = useState('');
  const [strDiff, setStrDiff] = useState('');
  const [sheetIdx, setSheetIdx] = useState(0);
  const [diffHtml, setDiffHtml] = useState('');

  const SHEET_TYPE = {
    SRC: ['file_src', setSheetsSrc, setLeftTitle],
    DIFF: ['file_diff', setSheetsDiff, setRightTitle]
  }

  const theme = 'auto'

  function getDiffStr(sheetsStr, sheetIdx) {
    let srcStr = ''
    for (const line of sheetsStr[sheetIdx]?.data || []) {
      // for (let s of line) {
        // srcStr += `<textarea rows='1' cols='10'>${s ? s : ''}</textarea>`
        // srcStr += `<input type='text' style='width:100px; height:25px; border:5px;' readonly=true placeholder='${s ? s : ''}'></textarea>`
        // s = s ? `${s}` : ""
        // let realLength = 0
        // let realCut = 0
        // for (let i = 0; i < s.length; i++) {
        //   const charCode = s.charCodeAt(i);
        //   if (charCode >= 0 && charCode <= 128) realLength += 1;
        //   else realLength += 2;
        //   if (realLength > padLen) {
        //     realCut = i-1
        //     break
        //   }
        // }
        // if (realLength > padLen) {
        //   srcStr += s.slice(0, realCut)
        // } else {
        //   srcStr += s
        //   for (let i=0; i<padLen-realLength; i++)
        //     srcStr += ' '
        // }
      // }
      srcStr += line.join('~')
      srcStr += '\n'
    }
    return srcStr
  }

  useEffect(() => {
    const srcStr = getDiffStr(sheetsSrc, sheetIdx)
    const diffStr = getDiffStr(sheetsDiff, sheetIdx)
    setStrSrc(srcStr)
    setStrDiff(diffStr)
    // const patch = createPatch('', srcStr, diffStr, '', '', {context: 10})
    // const diffJson = parse(patch)
    // const htmldraw = html(diffJson, { drawFileList: false, outputFormat: 'side-by-side'});
    // setDiffHtml(htmldraw)
  }, [sheetsSrc, sheetsDiff, diffHtml, sheetIdx, strSrc, strDiff])

  const getFilds = (idName) =>{
    return () => {
      const filedom = document.getElementById(idName);
      filedom.click()
    }
  }

  const fileInputChange = (setSheet, setTitle) => {
    return (event) => {
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
  const inputSyntax = (str) => {
    const strs = str ? str.split('~') : []
    let result = ""
    for (const s of strs) {
      result += `<input type='text' style='width:100px; height:25px; border:5px;' readonly=true placeholder='${s}'> </input>`
    }
    return (
      <div
        style={{ display: 'inline' }}
        dangerouslySetInnerHTML={{
          __html: result
        }}
      />
    )
  };

  return (
    <React.Fragment>
      <Row gutter={10} wrap={false}>
        <Col span={12}>
          <input id={SHEET_TYPE.SRC[0]} type='file' accept=".xls,.xlsx" style={{display:'none'}} onChange={fileInputChange(SHEET_TYPE.SRC[1], SHEET_TYPE.SRC[2])}></input>
          <Button icon={<UploadOutlined />} onClick={getFilds(SHEET_TYPE.SRC[0])}>Click to Upload</Button>
        </Col>
        <Col span={12}>
          <input id={SHEET_TYPE.DIFF[0]} type='file' accept=".xls,.xlsx" style={{display:'none'}} onChange={fileInputChange(SHEET_TYPE.DIFF[1], SHEET_TYPE.DIFF[2])}></input>
          <Button icon={<UploadOutlined />} onClick={getFilds(SHEET_TYPE.DIFF[0])}>Click to Upload</Button>
        </Col>
      </Row>
      <ReactDiffViewer oldValue={strSrc} newValue={strDiff} splitView={true} leftTitle={leftTitle} rightTitle={rightTitle} renderContent={inputSyntax} showDiffOnly={true}/>
      {/* <div className={`react-code-diff-lite ${theme}`}
        dangerouslySetInnerHTML={{__html: diffHtml}}>
      </div> */}
    </React.Fragment>
  );
}


export default ExcelDiff