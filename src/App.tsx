import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './routes/Home';
import Search from './routes/Search';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <header>
        <h1>Last.fm Clone</h1>
        <nav>
          <Link to="/">Главная</Link>
          <Link to="/search">Поиск</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
