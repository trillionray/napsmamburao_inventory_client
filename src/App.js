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
import AllTimeLogs from './pages/AllTimeLogs';

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

     notyf.error({
      type: 'info',
      message: 'Please wait 1–3 mins, server might be slow...',
      duration: 5000, // 5 seconds
      ripple: true,
    });


    fetch(`${process.env.REACT_APP_API_URL}/users/details`, {
      headers: {
        Authorization: `Bearer ${ localStorage.getItem('token') }`
      }
    })
    .then(res => res.json())
    .then(data => {
      console.log(data)
      if (data && data._id) {
        setUser({
          id: data._id,
          role: data.role,
          name: data.name
        });
      } else {
        setUser({
          id: null,
          role: null
        });
      }

    })
    .catch((error) => {
      console.log(error)
      setUser({ id: null, role: null });
    });

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
            <Route path="/admin/timelogs" element={<AllTimeLogs />} />

            
          </Routes>
        </Container>
      </Router>
    </UserProvider>
  );
}

export default App;