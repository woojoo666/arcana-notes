const Interpreter = window.Interpreter;

class IDE extends React.Component {
	state = {
		rawCode: 'foo: (bar: -1+x*2/y, x: 10, y: 3)\nclone: foo(x: 15)\nbarAlias: clone.bar\ntrue: false',
	}

	handleChange (event) {
		const rawCode = event.target.value;
		this.setState({ rawCode });
	}

	parse () {
		try {
			const output = new Interpreter(this.state.rawCode).interpretTest();
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
		const propertiesArray = this.props.val ? [...this.props.val.properties.entries()] : [];

		return <div className='axis-object'>
			{ propertiesArray.map(([key,valueNode]) => (
				<div className='axis-property' key={key}>
					<span className='axis-property-key'> { String(key) /* TODO: support object keys */ } : </span>
					{ typeof valueNode.value == 'object'
						? <ObjectNodeComponent val={valueNode.value}></ObjectNodeComponent>
						: <span className='axis-raw-value'> { String(valueNode.value) } </span>
					}
				</div>
			))}
		</div>
	}
}

ReactDOM.render(<IDE />, document.getElementById('app'));
