import { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { UserProvider } from './context/UserContext';
import AppNavbar from './components/AppNavbar';

import Login from './pages/Login';
import Logout from './pages/Logout';
import Register from './pages/Register';

import Items from './pages/Items';

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

     notyf.open({
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
          role: data.role
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
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/register" element={<Register />} />

            <Route path="/items" element={<Items />} />

            
          </Routes>
        </Container>
      </Router>
    </UserProvider>
  );
}

export default App;