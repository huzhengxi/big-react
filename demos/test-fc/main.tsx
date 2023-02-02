import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(100);
	const arr =
		num % 2 === 0
			? [<li key={'1'}>1</li>, <li key={'2'}>2</li>, <li key={'3'}>3</li>]
			: [<li key={'3'}>3</li>, <li key={'2'}>2</li>, <li key={'1'}>1</li>];
	// return <ul onClick={() => setNum(num + 1)}>{arr}</ul>;
	return (
		<ul>
			<li>3</li>
			<li>4</li>
			{arr}
		</ul>
	);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
