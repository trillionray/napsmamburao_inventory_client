import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const notyf = new Notyf();

const AllTimeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  // Fetch all logs
  const fetchAllLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/timelogs/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      console.log(data);
      setLogs(data.timelogs || []);
    } catch (error) {
      console.error(error);
      notyf.error("Failed to fetch time logs");
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (timelogId) => {
  try {
    const res = await fetch(`${API_URL}/timelogs/${timelogId}/paid`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to mark as paid");

    notyf.success("Time log marked as paid");
    fetchAllLogs(); // refresh table
  } catch (error) {
    console.error(error);
    notyf.error("Unable to update paid status");
  }
};

  useEffect(() => {
    fetchAllLogs();
  }, []);

  const columns = [
    {
      name: "User",
      cell: (row) => {
        const timeInDate = new Date(row.timeIn);
        const today = new Date();
        const isToday =
          timeInDate.getDate() === today.getDate() &&
          timeInDate.getMonth() === today.getMonth() &&
          timeInDate.getFullYear() === today.getFullYear();
        const isActive = isToday && !row.timeOut;

        return (
          <span style={{ color: isActive ? "green" : "inherit", fontWeight: isActive ? "bold" : "normal" }}>
            {row.userId?.name ?? "-"}
          </span>
        );
      },
      sortable: true
    },
    { name: "Time In", selector: row => new Date(row.timeIn).toLocaleString(), sortable: true },
    { name: "Time Out", selector: row => row.timeOut ? new Date(row.timeOut).toLocaleString() : "-", sortable: true },
    { name: "Total Time (Hours)", selector: row => row.totalTime ? row.totalTime.toFixed(2) : "-", sortable: true },
    {
      name: "Paid",
      cell: (row) =>
        row.isPaid ? (
          <span className="text-success fw-bold">Yes</span>
        ) : (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => markAsPaid(row._id)}
          >
            No
          </button>
        ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    }
  ];


  return (
    <Container className="mt-4">
      <Row className="mb-3 text-center">
        <Col>
          <h2>Time Logs</h2>
        </Col>
      </Row>

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

export default AllTimeLogs;
