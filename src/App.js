import { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { UserProvider } from './context/UserContext';
import AppNavbar from './components/AppNavbar';

import Login from './pages/Login';
import Logout from './pages/Logout';
import Register from './pages/Register';

import Items from './pages/Items';

import MyTimeLogs from './pages/MyTimeLogs';
import MyTimeLogsSummary from './pages/MyTimeLogsSummary';
import AllTimeLogs from './pages/AllTimeLogs';

import ProductsPage from './pages/AllTimeLogs';

import OrdersPage from './pages/OrdersPage';
import LateAddOrder from './pages/LateAddOrder';
import OrderView from './pages/OrderView';
import OrdersSummary from './pages/OrdersSummary';


import Salaries from './pages/Salaries';
import Payroll from './pages/Payroll';

import { Notyf } from 'notyf'; // ✅ Import Notyf
import 'notyf/notyf.min.css'; // ✅ Add this


function App() {
  const notyf = new Notyf(); // initialize Notyf

  const [user, setUser] = useState({
    id: null,
    role: null
  });

  function unsetUser(){
    localStorage.clear();
  };

  useEffect(() => {
    const initialize = async () => {
      notyf.open({
        type: "info",
        message: "Waking up servers...",
        duration: 4000,
      });

      // Wake servers (non-blocking)
      const wakePromises = [
        fetch(`${process.env.REACT_APP_API_URL}/wake`)
          .then(res => ({ server: "API 1", ok: res.ok }))
          .catch(() => ({ server: "API 1", ok: false })),

        fetch(`${process.env.REACT_APP_API_URL2}/wake`)
          .then(res => ({ server: "API 2", ok: res.ok }))
          .catch(() => ({ server: "API 2", ok: false })),
      ];

      const results = await Promise.all(wakePromises);

      // Show per-server status
      results.forEach(r => {
        if (r.ok) {
          notyf.success(`${r.server} is awake`);
        } else {
          notyf.error(`${r.server} failed to wake`);
        }
      });

      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/users/details`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await res.json();

        if (data && data._id) {
          setUser({
            id: data._id,
            role: data.role,
            name: data.name,
          });
        } else {
          setUser({ id: null, role: null });
        }
      } catch (error) {
        console.log(error);
        setUser({ id: null, role: null });
        notyf.error("Failed to load user details");
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    console.log('User:', user);
    console.log('LocalStorage:', localStorage);
  }, [user]);

  return (
    <UserProvider value={{ user, setUser, unsetUser }}>
      <Router>
        <AppNavbar />
        <Container fluid className="pt-4">
          <Routes>
            <Route path="/" element={<Items />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/register" element={<Register />} />

            <Route path="/items" element={<Items />} />
            <Route path="/mytimelogs" element={<MyTimeLogs />} />
            <Route path="/mytimelogssummary" element={<MyTimeLogsSummary />} />
            <Route path="/admin/timelogs" element={<AllTimeLogs />} />


            <Route path="/products" element={<ProductsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/late-add-orders" element={<LateAddOrder />} />
            <Route path="/orders/summary" element={<OrdersSummary />} />
            <Route path="/orders/:orderId" element={<OrderView />} />
            <Route path="/salaries" element={<Salaries />} />
            <Route path="/payroll" element={<Payroll />} />


          </Routes>
        </Container>
      </Router>
    </UserProvider>
  );
}

export default App;