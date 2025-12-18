import React, {useState} from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
// Rule Templates
import {AdvancedTemp} from '../templates/ruleTemplates';

const AdvancedTemplates: React.FC = () => {
  const [rule, setRule] = useState('{}');
  return (
    <div className="App">
      <div className="container">
        <div className="columns">
          <div className="column is-one-third">
            <div className="left-menu">
              <div className="block">
                {AdvancedTemp.map(r => (
                  <button
                    key={`rule-${r.label}`}
                    className="button"
                    onClick={() => setRule(JSON.stringify(r.value, null, 2))}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="column">
            <div id="example">
              <AceEditor
                height="800px"
                width="1024px"
                mode="json"
                theme="monokai"
                name="textarea"
                value={rule}
                editorProps={{$blockScrolling: true}}
                setOptions={{fontSize: 15}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTemplates;
