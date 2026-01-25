import { useState, useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import UserContext from "../context/UserContext";
import { Notyf } from "notyf";
// import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

export default function Login() {

  // const navigate = useNavigate();

  const notyf = new Notyf();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState("");

  const { user, setUser } = useContext(UserContext);

  function authenticate(e) {
    e.preventDefault();

    fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
      	console.log(data)
        if (data.access) {
          localStorage.setItem("token", data.access);
          retrieveUserDetails(data.access);
          setEmail("");
          setPassword("");
          notyf.success("Login successful");
        } else {
          setError(data.message || "Invalid credentials");
          notyf.error(data.message || "Login failed");
        }
      })
      .catch(() => {
        notyf.error("Server not responding");
      });
  }

  function retrieveUserDetails(token) {
    fetch(`${API_URL}/users/details`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser({
          id: data._id,
          email: data.email,
          role: data.role,
        });
      });
  }

  useEffect(() => {
    setIsActive(email !== "" && password !== "");
  }, [email, password]);

  if (user.id) {
    return <Navigate to="/items" />;
  }

  return (
    <Container className="d-flex justify-content-center mt-5">
      <Card style={{ width: "100%", maxWidth: "400px" }} className="shadow mt-5">
        <Card.Body>
          <Card.Title className="text-center mb-4">Login</Card.Title>

          {/*{error && <Alert variant="danger">{error}</Alert>}*/}

          <Form onSubmit={authenticate}>
            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              type="submit"
              className="w-100"
              variant={isActive ? "success" : "secondary"}
              disabled={!isActive}
            >
              Login
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
