import React from 'react';
import {ProcessNode, SBSMLParser, StepNode} from 'sbsmljs/lib/parser';

export class SBSLinter extends React.Component {
    constructor(props) {
      super(props);
      this.state = {};
    }
  
    render() {
        return (
        <form>
            <TextEditor/>
        </form>
        );
    }
}

  class TextEditor extends React.Component {
    constructor(props) {
      super(props);
      this.handleChange = this.handleChange.bind(this);
      this.state = {
          value: ""
      };
    }
    handleChange(event) {
        //var parser = SBSMLParser.parse(event.target.value);
        this.setState({value: event.target.value});
    }
    render() {
        return (
        <div className="editorMain">
            <textarea value={this.state.value} onChange={this.handleChange}/>
            <TextDisplay text={this.state.value}/>
        </div>
        );
    }
}

class TextDisplay extends React.Component {
    parse(text) {
        var lines = text.split(/\r?\n/);
        var fmtLines = [];
        lines.forEach((line, index) => {
            var nodeType = SBSMLParser.parseLine(line);
            switch(nodeType) {
                case ProcessNode:
                    fmtLines.push(<ProcessLine text={line} key={index}/>)
                    break;
                case StepNode:

                    fmtLines.push(<StepLine text={line} key={index}/>)
                    break;
                default:
                    fmtLines.push(line + "\n")
                    break;
            }
        })
        return fmtLines;
    }

    render() {
        var fmtText = this.parse(this.props.text);
        return (
            <pre className="editorPre">{fmtText}</pre>
        );
    }
}

class ProcessLine extends React.Component {
    render() {
        return (
            <div className="greenHighlight">{this.props.text}</div>
        )
    }
}

class StepLine extends React.Component {
    render() {
        return (
            <div className="yellowHighlight">{this.props.text}</div>
        )
    }
}