import { useEffect, useState } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";

import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
} from "react-bootstrap";

const notyf = new Notyf();

export default function Salaries() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");

  const [currentSalary, setCurrentSalary] = useState(null);
  const [history, setHistory] = useState([]);

  const [form, setForm] = useState({
    salary: "",
    frequency: "semi_monthly",
    allowances: 0,
    effectiveFrom: "",
  });

  const token = localStorage.getItem("token");

  // GET USERS
  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUsers(data);
    } catch (err) {
      notyf.error(err.message);
    }
  };

  // GET CURRENT
  const fetchCurrent = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/salaries/current/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setCurrentSalary(data);
    } catch (err) {
      notyf.error(err.message);
    }
  };

  // GET HISTORY
  const fetchHistory = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/salaries/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setHistory(data);
    } catch (err) {
      notyf.error(err.message);
    }
  };

  // ADD SALARY
  const handleAddSalary = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/salaries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      notyf.success("Salary updated successfully");

      fetchCurrent(userId);
      fetchHistory(userId);
    } catch (err) {
      notyf.error(err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Container className="py-4">
      <h3 className="mb-4">Salary Management</h3>

      {/* USER SELECT */}
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Employee</Form.Label>
                <Form.Select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                >
                  <option value="">Select Employee</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Button
                variant="primary"
                className="w-100"
                disabled={!userId}
                onClick={() => {
                  fetchCurrent(userId);
                  fetchHistory(userId);
                }}
              >
                Load
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* CURRENT SALARY */}
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <h5>Current Salary</h5>
          {currentSalary ? (
            <h4 className="text-success">
              ₱{currentSalary.salary} / {currentSalary.frequency}
            </h4>
          ) : (
            <p className="text-muted">No data selected</p>
          )}
        </Card.Body>
      </Card>

      <Row>
        {/* HISTORY */}
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Salary History</h5>

              <Table striped hover size="sm" className="mt-3">
                <thead>
                  <tr>
                    <th>Salary</th>
                    <th>Frequency</th>
                    <th>From</th>
                    <th>To</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item._id}>
                      <td>₱{item.salary}</td>
                      <td>{item.frequency}</td>
                      <td>
                        {new Date(
                          item.effectiveFrom
                        ).toLocaleDateString()}
                      </td>
                      <td>
                        {item.effectiveTo
                          ? new Date(
                              item.effectiveTo
                            ).toLocaleDateString()
                          : "Present"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* FORM */}
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Add / Update Salary</h5>

              <Form onSubmit={handleAddSalary}>
                <Form.Group className="mb-2">
                  <Form.Label>Salary</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.salary}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        salary: e.target.value,
                      })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Frequency</Form.Label>
                  <Form.Select
                    value={form.frequency}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        frequency: e.target.value,
                      })
                    }
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="semi_monthly">
                      Semi Monthly
                    </option>
                    <option value="monthly">Monthly</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Allowances</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.allowances}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        allowances: e.target.value,
                      })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Effective From</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.effectiveFrom}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        effectiveFrom: e.target.value,
                      })
                    }
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="success"
                  className="w-100"
                  disabled={!userId}
                >
                  Save Salary
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}