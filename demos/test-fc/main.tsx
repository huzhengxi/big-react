import { useState, useEffect } from 'react';
import ReactNoop from 'react-noop-renderer';

function App() {
	return (
		<>
			<Child />
			<div>hello world</div>
		</>
	);
}

function Child() {
	return 'Child';
}

const root = ReactNoop.createRoot();
root.render(<App />);
window.root = root;
