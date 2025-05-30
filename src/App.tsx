import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './routes/Home';
import Search from './routes/Search';
import { useEffect } from 'react';

export default function App() {
      useEffect(() => {
    console.log('React App started');
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
      </Route>
    </Routes>
  );
}