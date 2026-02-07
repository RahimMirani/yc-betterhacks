import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ReaderPage from './pages/ReaderPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/reader/:paperId" element={<ReaderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
