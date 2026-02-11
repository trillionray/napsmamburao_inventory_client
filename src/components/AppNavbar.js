import { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import UserContext from '../context/UserContext';

export default function AppNavbar() {
  const { user } = useContext(UserContext);
  console.log(user);
  const isLoggedIn = user?.id != null;

  return (
    <Navbar 
      expand="lg" 
      variant="dark" 
      style={{ borderBottom: "2px solid white" }}
    >
      <Container>
        <Navbar.Brand as={Link} to="/">Naps Internal </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {isLoggedIn ? (
              <>

                {user.role === "admin" && (
                  <>
                    <Nav.Link as={NavLink} to="/items">Inventory</Nav.Link>
                    <Nav.Link as={NavLink} to="/admin/timelogs">AllLogs</Nav.Link>
                  </>
                )}

                
                <Nav.Link as={NavLink} to="/mytimelogs">MyLogs</Nav.Link>
                <Nav.Link as={NavLink} to="/logout">Logout</Nav.Link>
                <Nav.Link disabled style={{ cursor: 'default', display: 'flex', alignItems: 'center' }}>
                  <span className="me-1 text-white">&#128100;</span> {/* user emoji as icon */}
                  <span className="badge bg-light text-dark" style={{ fontSize: '0.9rem', padding: '0.5em 0.8em' }}>
                    {user.name}
                  </span>
                </Nav.Link>
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
