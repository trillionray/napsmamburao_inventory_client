import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import { Container, Row, Col, Button, Card, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const notyf = new Notyf();

const MyTimeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTimeLogs();
  }, []);

  const fetchTimeLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/timelogs/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch time logs");
      const data = await res.json();
      setLogs(data.timelogs || []);
    } catch (error) {
      console.error(error);
      notyf.error("Failed to fetch time logs");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeIn = () => {
    setActionLoading(true);

    fetch(`${API_URL}/timelogs/time-in`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.message === "User already clocked in.") {
          notyf.error(data.message);
        } else if (data.message === "Clock In successful") {
          notyf.success(data.message);
        }
        fetchTimeLogs();
      })
      .catch(error => {
        console.error(error);
        notyf.error(error.message);
      })
      .finally(() => setActionLoading(false));
  };

  const handleTimeOut = () => {
    setActionLoading(true);

    fetch(`${API_URL}/timelogs/time-out`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Clock Out failed");
        return res.json();
      })
      .then(data => {
        notyf.success("Clock Out successful");
        fetchTimeLogs();
      })
      .catch(error => {
        console.error(error);
        notyf.error(error.message);
      })
      .finally(() => setActionLoading(false));
  };

  const columns = [
    {
      name: "Time In",
      selector: row => new Date(row.timeIn).toLocaleString(),
      sortable: true
    },
    {
      name: "Time Out",
      selector: row => row.timeOut ? new Date(row.timeOut).toLocaleString() : "-",
      sortable: true
    },
    {
      name: "Total Time (Hours)",
      selector: row => row.totalTime ? row.totalTime.toFixed(2) : "-",
      sortable: true
    },
    {
      name: "Paid",
      selector: row => row.isPaid ? "Yes" : "No",
      sortable: true
    }
  ];

  return (
    <Container className="mt-4">
      <Row className="mb-3 text-center">
        <Col>
          <h2>My Time Logs</h2>
        </Col>
      </Row>

      {/* Clock In / Clock Out Buttons */}
      <Row className="mb-4 text-center">
        <Col>
          <Button
            variant="success"
            onClick={handleTimeIn}
            disabled={actionLoading}
            className="me-2"
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : "Clock In"}
          </Button>

          <Button
            variant="danger"
            onClick={handleTimeOut}
            disabled={actionLoading}
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : "Clock Out"}
          </Button>
        </Col>
      </Row>

      {/* DataTable inside a Card */}
      <Card>
        <Card.Body>
          <DataTable
            columns={columns}
            data={logs}
            progressPending={loading}
            pagination
            highlightOnHover
            striped
            dense
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MyTimeLogs;
