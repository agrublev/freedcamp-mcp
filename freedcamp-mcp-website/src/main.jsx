import { ViteReactSSG } from 'vite-react-ssg/single-page';
import App from './App.jsx';
import './styles/fonts.css';
import './styles/design.css';
import './styles/components.css';

// Single-page SSG: the docs are one long indexable page (anchor nav),
// exactly like the claude_design source document.
export const createRoot = ViteReactSSG(<App />);
