const Interpreter = window.Interpreter;

class IDE extends React.Component {
	state = {
		rawCode: 'foo: (bar: -1+x*2/y, x: 10, y: 3)\nclone: foo(x: 15)\nbarAlias: clone.bar',
	}

	handleChange (event) {
		const rawCode = event.target.value;
		this.setState({ rawCode });
	}

	parse () {
		try {
			const output = new Interpreter(this.state.rawCode).interpretTest({}, 'Indent');
			return output;
		} catch (e) {
			console.log("Runtime error.");
			console.log(e);
			return null;
		}
	}

	render () {
		const output = this.parse();
		return <div className='IDE-container'>
			<textarea className='inputbox' type='text' value={this.state.rawCode} onChange={e => this.handleChange(e)}></textarea>
			<div className='outputbox'>
				<ObjectNodeComponent val={output}></ObjectNodeComponent>
			</div>
		</div>
	}
}

// TODO: handle circular references
class ObjectNodeComponent extends React.Component {

	render () {
		return <div className='axis-object'>
		{ Object.entries(this.props.val ? this.props.val.properties : []).map(([key,valueNode]) => (
			<div className='axis-property' key={key}>
				<span className='axis-property-key'> { key } : </span>
				{ isNaN(valueNode.value)
					? <ObjectNodeComponent val={valueNode.value}></ObjectNodeComponent>
					: <span className='axis-raw-value'> { valueNode.value } </span>
				}
			</div>
		))} </div>
	}
}

ReactDOM.render(<IDE />, document.getElementById('app'));
