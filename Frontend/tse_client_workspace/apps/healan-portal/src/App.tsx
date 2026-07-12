import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/Landing';
import BlogListPage from './pages/Blog/List';
import BlogPostPage from './pages/Blog/Post';
import AssistantPage from './pages/Assistant';
import { FloatingRobotButton } from './components/FloatingRobotButton';

export default function App() {
  return (
    <BrowserRouter>
      <FloatingRobotButton />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
