import { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import UserContext from '../context/UserContext';

export default function AppNavbar() {
  const { user } = useContext(UserContext);
  const isLoggedIn = user?.id != null;

  return (
    <Navbar 
      expand="lg" 
      variant="dark" 
      style={{ borderBottom: "2px solid white" }}
    >
      <Container>
        <Navbar.Brand as={Link} to="/">Naps Inventory (Mamburao) </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {isLoggedIn ? (
              <>
                <Nav.Link as={NavLink} to="/items">Items</Nav.Link>
                <Nav.Link as={NavLink} to="/logout">Logout</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
                <Nav.Link as={NavLink} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
