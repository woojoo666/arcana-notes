const Interpreter = window.Interpreter;

class IDE extends React.Component {
	state = {
		rawCode: '',
		output: undefined
	}

	handleChange (event) {
		this.setState({ rawCode: event.target.value });

		const output = new Interpreter(this.state.rawCode).interpretTest({}, 'Indent');
		this.setState({ output });
	}

	render () {
		return <div className='IDE-container'>
			<textarea type='text' value={this.state.rawCode} onChange={e => this.handleChange(e)}></textarea>
			<div></div>
		</div>
	}
}

ReactDOM.render(<IDE />, document.getElementById('app'));
