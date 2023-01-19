import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num] = useState(100);
	return (
		<div>
			<span>{num}</span>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
