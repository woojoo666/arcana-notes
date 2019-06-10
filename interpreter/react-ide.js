const Interpreter = window.Interpreter;

class IDE extends React.Component {
	state = {
		rawCode: '',
		output: undefined
	}

	handleChange (event) {
		const rawCode = event.target.value;
		this.setState({ rawCode });

		try {
			const output = new Interpreter(rawCode).interpretTest({}, 'Indent');
			this.setState({ output });
		} catch (e) {
			console.log("Runtime error.");
			console.log(e);
		}
	}

	render () {
		return <div className='IDE-container'>
			<textarea type='text' value={this.state.rawCode} onChange={e => this.handleChange(e)}></textarea>
			<div></div>
		</div>
	}
}

ReactDOM.render(<IDE />, document.getElementById('app'));
