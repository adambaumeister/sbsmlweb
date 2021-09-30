import React from 'react';
import {ProcessNode, SBSMLParser, StepNode, DescriptionNode, SubStepNode} from 'sbsmljs/lib/parser';
import {Playbook} from 'sbsmljs/lib/playbook';

const TEXT_DISPLAY_TYPE = "TEXT";
const YAML_DISPLAY_TYPE = "XSOAR YAML"

const EXAMPLE_SBS = `--- Bake a cake ---
1. Butter > Melt some butter >> melted butter
    1a. Put the cake in a small dish
    1b. Melt in the microwave
2. Mix the butter with the cake Mix
This makes the icing mix good.
3. Put the cake in the oven
4. Wait 30 minutes
5. Take the cake out of the oven
then: Make the icing

--- Make the icing ---
1. Melt some more butter
2. Mix the butter with the icing and milk
3. Spread the icing on the cake!`

export class SBSLinter extends React.Component {
    constructor(props) {
        super(props);
        this.setParser = this.setParser.bind(this);
        this.setParserError = this.setParserError.bind(this);
        this.clearParserError = this.clearParserError.bind(this);
        this.toggleDisplayType = this.toggleDisplayType.bind(this);

        this.state = {
            parser: null,
            parserError: null,
            displayType: TEXT_DISPLAY_TYPE
        };
    }

    setParser(newParser) {
        this.setState({
            parser: newParser
        });
    }

    setParserError(err) {
        this.setState({
            parserError: err
        })
    }

    clearParserError() {
        this.setState({
            parserError: null
        })
    }

    toggleDisplayType() {
        if (this.state.displayType === TEXT_DISPLAY_TYPE) {
            this.setState({
                displayType: YAML_DISPLAY_TYPE
            })
        } else {
            this.setState({
                displayType: TEXT_DISPLAY_TYPE
            })
        }

    }

    render() {
        let display = null;
        if (this.state.displayType === TEXT_DISPLAY_TYPE) {
            display = <ParsedDisplay toggleDisplayType={this.toggleDisplayType} parser={this.state.parser}
                                     parserError={this.state.parserError} displayType={this.state.displayType}/>
        }
        if (this.state.displayType === YAML_DISPLAY_TYPE) {
            display = <YamlDisplay toggleDisplayType={this.toggleDisplayType} parser={this.state.parser}
                                   parserError={this.state.parserError} displayType={this.state.displayType}/>
        }

        return (
            <div className="row main justify-content-center">
                <div className="col p-0" style={{display: "contents"}}>
                    <form className="editorMainForm">
                        <TextEditor updateParser={this.setParser} setParserError={this.setParserError}
                                    clearParserError={this.clearParserError}/>
                    </form>
                    {display}
                </div>
            </div>
        );
    }
}

class TextEditor extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleScroll = this.handleScroll.bind(this);

        this.state = {
            value: EXAMPLE_SBS,
            scrollTopValue: "",
            parserError: null
        };
        this.myRef = React.createRef();
    }

    componentDidMount() {
        var newParser = SBSMLParser.parse(this.state.value);
        this.props.updateParser(newParser);
    }

    handleChange(event) {
        try {
            var newParser = SBSMLParser.parse(event.target.value);
        } catch (err) {
            this.props.setParserError(err)
            this.setState({
                value: event.target.value,
                parserError: err,
            });
            return;
        }
        this.props.clearParserError();
        this.props.updateParser(newParser);
        this.setState({
            value: event.target.value,
            parserError: null,
        });
    }

    handleScroll() {
        this.setState({
            scrollTopValue: this.myRef.current.scrollTop,
            scrollLeftValue: this.myRef.current.scrollLeft,

        })
    }

    render() {
        return (
            <div className="editorMain">
                <TextDisplay text={this.state.value} scrollTop={this.state.scrollTopValue}
                             scrollLeft={this.state.scrollLeftValue} parserError={this.state.parserError}/>
                <textarea onScroll={this.handleScroll} ref={this.myRef} className="invis text-nowrap"
                          value={this.state.value} onChange={this.handleChange}/>
            </div>
        );
    }
}

class TextDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.myRef = React.createRef();
    }

    componentDidUpdate() {
        if (this.myRef.current) {
            this.myRef.current.scrollTop = this.props.scrollTop;
            this.myRef.current.scrollLeft = this.props.scrollLeft;
        }
    }

    parse(text) {
        var lines = text.split(/\r?\n/);
        var fmtLines = [];

        lines.forEach((line, index) => {
            var nodeType = SBSMLParser.parseLine(line);
            var skipNode = false;

            if (this.props.parserError !== null) {
                if (this.props.parserError.line === index) {
                    fmtLines.push(<ErrorLine text={line}/>);
                    skipNode = true;
                }
            }

            if (!skipNode) {
                switch (nodeType) {
                    case ProcessNode:
                        fmtLines.push(<ProcessLine text={line} key={index}/>)
                        break;
                    case StepNode:
                        fmtLines.push(<StepLine text={line} key={index}/>)
                        break;
                    case SubStepNode:
                        fmtLines.push(<SubStepLine text={line} key={index}/>)
                        break;
                    case DescriptionNode:
                        fmtLines.push(<DescriptionLine text={line} key={index}/>)
                        break;
                    default:
                        fmtLines.push(line + "\n")
                        break;
                }
            }
        })
        return fmtLines;
    }

    render() {
        var fmtText = this.parse(this.props.text);
        return (
            <pre ref={this.myRef} scrollTop={this.props.scrollTop} scrollLeft={this.props.scrollLeft}
                 className="editorPre">{fmtText}</pre>
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

class SubStepLine extends React.Component {
    render() {
        return (
            <div className="lightYellowHighlight">{this.props.text}</div>
        )
    }
}

class ErrorLine extends React.Component {
    render() {
        return (
            <div className="redHighlight">{this.props.text}</div>
        )
    }
}

class DescriptionLine extends React.Component {
    render() {
        return (
            <div className="blueHighlight">{this.props.text}</div>
        )
    }
}

class ChangeDisplayButton extends React.Component {
    render() {
        // Swap them around
        let t = TEXT_DISPLAY_TYPE;
        if (this.props.displayType === TEXT_DISPLAY_TYPE) {
            t = YAML_DISPLAY_TYPE;
        }
        return (
            <button type="button" onClick={this.props.toggleDisplayType} className="btn btn-secondary">{t}</button>
        )
    }
}


class ButtonGroup extends React.Component {
    render() {
        return (
            <div className="btn-group" role="group" aria-label="Basic example">
                <ChangeDisplayButton toggleDisplayType={this.props.toggleDisplayType} displayType={this.props.displayType}/>
            </div>
        )
    }
}

class YamlDisplay extends React.Component {
    render() {
        let renderedPlaybook = Playbook.render(this.props.parser);
        let yamlText = renderedPlaybook.toYaml();
        return (
            <div>
            <pre className="yamlPre p-3">
                <div style={{textAlign: "center"}}>
                    <ButtonGroup toggleDisplayType={this.props.toggleDisplayType} displayType={this.props.displayType}/>
                </div>
                {yamlText}
            </pre>
            </div>
        )
    }
}

class ParsedDisplay extends React.Component {
    render() {
        if (this.props.parserError != null) {
            return (
                <div className="parsedDisplay p-3 float-left">
                    <ErrorDisplay parserError={this.props.parserError}/>
                </div>
            )
        }

        var parser = this.props.parser;
        var processNodeDisplays = [];
        if (parser !== null) {
            parser.processNodes.forEach((pnode, i) => {
                processNodeDisplays.push(<ProcessNodeDisplay key={i} node={pnode}/>)
            })
        }
        return (
            <div className="parsedDisplay p-3 float-left">
                <div style={{textAlign: "center"}}>
                    <ButtonGroup toggleDisplayType={this.props.toggleDisplayType} displayType={this.props.displayType}/>
                </div>
                {processNodeDisplays}
            </div>
        )
    }
}

class ProcessNodeDisplay extends React.Component {
    render() {
        var stepNodes = [];
        this.props.node.stepNodes.forEach((snode, i) => {
            stepNodes.push(<StepNodeDisplay key={i} node={snode}/>)
        })
        return (
            <div className="left-align">
                <h2 className="rounded p-2 processNode bg-light">{this.props.node.nodeName}</h2>
                {stepNodes}
            </div>
        )
    }
}

class StepNodeDisplay extends React.Component {
    render() {
        return (
            <div>
                <h5 className="stepNode">{this.props.node.nodeName}
                    <br/>
                </h5>
                <DescriptionDisplay descriptionNode={this.props.node.descriptionNode}/>
            </div>

        )
    }
}

class DescriptionDisplay extends React.Component {
    render() {
        if (this.props.descriptionNode.text !== null) {
            return (
                <h6 className="descriptionNode">{this.props.descriptionNode.text}</h6>
            )
        }

        return null;
    }
}

class ErrorDisplay extends React.Component {
    render() {
        console.log(this.props.parserError.message);
        return (
            <h5 className="text-danger">Line #{this.props.parserError.line}: {this.props.parserError.message}</h5>
        )

    }
}