import React, { useEffect, useState } from "react";
import { Row, Col, Button, Radio } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
// import {createPatch} from 'diff';
// import {parse, html} from 'diff2html';
// import 'diff2html/bundles/css/diff2html.min.css';
import xlsx from 'node-xlsx';
import ReactDiffViewer from 'react-diff-viewer';
import './diff.less'


const ExcelDiff = () => {

  const [leftSheets, setLeftSheets] = useState([]);
  const [rightSheets, setRightSheets] = useState([]);
  const [leftTitle, setLeftTitle] = useState('');
  const [rightTitle, setRightTitle] = useState('');
  const [leftStr, setStrSrc] = useState('');
  const [rightStr, setStrDiff] = useState('');
  const [sheetIdx, setSheetIdx] = useState(0);
  // const argv = this.$electron.remote.process.argv

  const SHEET_TYPE = {
    SRC: ['file_src', setLeftSheets, setLeftTitle],
    DIFF: ['file_diff', setRightSheets, setRightTitle]
  }

  function getDiffStr(sheetsStr, sheetIdx) {
    let srcStr = ''
    for (const line of sheetsStr[sheetIdx]?.data || []) {
      if (line.length > 0) {
        srcStr += line[0] ? line[0] : '&*'
        for (let i=1; i<line.length; i++) {
          const s = line[i] ? line[i] : '&*'
          srcStr += '~' + s
        }
      } else {
        srcStr += '&*'
      }
      srcStr += '\n'
    }
    return srcStr
  }

  useEffect(() => {
    const leftStr = getDiffStr(leftSheets, sheetIdx)
    const rightStr = getDiffStr(rightSheets, sheetIdx)
    setStrSrc(leftStr)
    setStrDiff(rightStr)
  }, [leftSheets, rightSheets, sheetIdx])

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
    console.log(str)
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

  const indexChange = (e) => {
    setSheetIdx(e.target.value)
  }

  return (
    <React.Fragment>
      <Radio.Group defaultValue='0' buttonStyle="solid" onChange={indexChange}>
        {
          leftSheets.map((c, idx) =>
            <Radio.Button value={idx}>{c.name}</Radio.Button>
          )
        }
      </Radio.Group>
      <Row>
        <Col span={12}>
          <input id={SHEET_TYPE.SRC[0]} type='file' accept=".xls,.xlsx" style={{display:'none'}} onChange={fileInputChange(SHEET_TYPE.SRC[1], SHEET_TYPE.SRC[2])}></input>
          <Button icon={<UploadOutlined />} onClick={getFilds(SHEET_TYPE.SRC[0])}>Click to Upload</Button>
        </Col>
        <Col span={12}>
          <input id={SHEET_TYPE.DIFF[0]} type='file' accept=".xls,.xlsx" style={{display:'none'}} onChange={fileInputChange(SHEET_TYPE.DIFF[1], SHEET_TYPE.DIFF[2])}></input>
          <Button icon={<UploadOutlined />} onClick={getFilds(SHEET_TYPE.DIFF[0])}>Click to Upload</Button>
        </Col>
      </Row>
      {
        leftStr && <ReactDiffViewer oldValue={leftStr} newValue={rightStr} splitView={true} leftTitle={leftTitle} rightTitle={rightTitle} 
        renderContent={inputSyntax} showDiffOnly={true} />
      }
    </React.Fragment>
  );
}


export default ExcelDiff