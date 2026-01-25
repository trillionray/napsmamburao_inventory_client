import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import UserContext from "../context/UserContext";
import { Notyf } from "notyf";

const API_URL = process.env.REACT_APP_API_URL;

export default function Register() {
  const notyf = new Notyf();
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Enable button only if all fields are filled
  useEffect(() => {
    setIsActive(formData.name && formData.email && formData.password);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        notyf.error(data.message || "Registration failed");
        return;
      }

      setUser(data.user);
      notyf.success("Registration successful");
      navigate("/"); // redirect after registration
    } catch {
      setError("Something went wrong. Try again.");
      notyf.error("Something went wrong. Try again.");
    }
  };

  return (
    <Container className="d-flex justify-content-center mt-5">
      <Card style={{ width: "100%", maxWidth: "400px" }} className="shadow mt-5">
        <Card.Body>
          <Card.Title className="text-center mb-4">Register</Card.Title>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Button
              type="submit"
              className="w-100"
              variant={isActive ? "success" : "secondary"}
              disabled={!isActive}
            >
              Register
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
