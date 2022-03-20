import React from "react";
import {createPatch} from 'diff';
import {parse, html} from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';

const newStr = `
  a: 1|
  b: 2|
  c: () => {
    return this.a
  }
`;

const oldStr = `
  a: 1|
  b: 2|
  getValue: () => {
    return this.b
  }
`;

const patch = createPatch('', oldStr, newStr, '', '', {context: 10})
const diffJson = parse(patch)
const htmldraw = html(diffJson, { drawFileList: true, outputFormat: 'side-by-side'});
console.log(htmldraw)
const theme = 'auto'

const Diff = () => {
  return (
    <React.Fragment>
      <div className={`react-code-diff-lite ${theme}`}
        dangerouslySetInnerHTML={{__html: htmldraw}}>
      </div>
    </React.Fragment>
  );
};

export default Diff