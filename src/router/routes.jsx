// routes.js
import { Routes, Route } from 'react-router-dom';
import Login from '../components/Login';
import Home from '../App';
import ProductDetail from '../components/ProductDetail';
import ProductPage from '../components/ProductPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/product/:productId" element={<ProductDetail />} />
      <Route path="/product" element={<ProductPage />} />
    </Routes>
  );
};

export default AppRoutes;
