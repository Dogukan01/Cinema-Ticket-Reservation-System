import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import MoviesList from './pages/MoviesList';
import MovieDetails from './pages/MovieDetails';
import TicketSelection from './pages/TicketSelection';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import Invoice from './pages/Invoice';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Header />
      <main style={{ padding: '40px 8%', maxWidth: '1400px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<MoviesList />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/showtimes/:id/tickets" element={<TicketSelection />} />
          <Route path="/showtimes/:id/seats" element={<SeatSelection />} />
          <Route path="/showtimes/:id/checkout" element={<Checkout />} />
          <Route path="/showtimes/:id/invoice" element={<Invoice />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
