import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import LoginPage from './pages/LoginPage';
import ReaderUploadPage from './pages/ReaderUploadPage';
import ReaderPage from './pages/ReaderPage';
import AuthGuard from './components/AuthGuard';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AuthGuard><App /></AuthGuard>} />
        <Route path="/reader" element={<AuthGuard><ReaderUploadPage /></AuthGuard>} />
        <Route path="/reader/:paperId" element={<AuthGuard><ReaderPage /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
