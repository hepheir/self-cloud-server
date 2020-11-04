const React = require('react');
const ReactDOM = require('react-dom');

export class Index extends React.Component {
    render() {
        return <h1>Hello</h1>;
    }
}

ReactDOM.render(<Index/>, document.getElementById('root'));
