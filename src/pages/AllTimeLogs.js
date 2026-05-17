import { useEffect, useState } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import {
  Container,
  Button,
  Spinner,
  Row,
  Col,
  Form,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import DataTable from "react-data-table-component";

const notyf = new Notyf();

const AllTimeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // SEARCH STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // EDIT STATE
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    timeIn: "",
    timeOut: "",
    tasks: "",
  });

  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  // ================= FETCH =================
  const fetchAllLogs = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/timelogs/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      const fetchedLogs = data.timelogs || [];

      setLogs(fetchedLogs);
      setFilteredLogs(fetchedLogs);

    } catch (error) {
      notyf.error("Failed to fetch time logs");
    } finally {
      setLoading(false);
    }
  };

  // ================= FILTER =================
  useEffect(() => {
    let filtered = [...logs];

    // SEARCH BY NAME
    if (searchTerm) {
      filtered = filtered.filter((log) =>
        log.userId?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    // FILTER START DATE
    if (startDate) {
      filtered = filtered.filter(
        (log) =>
          new Date(log.timeIn) >= new Date(startDate)
      );
    }

    // FILTER END DATE
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter(
        (log) =>
          new Date(log.timeIn) <= end
      );
    }

    setFilteredLogs(filtered);

  }, [searchTerm, startDate, endDate, logs]);

  // ================= CORRECTION ACTION =================
  const handleCorrectionAction = async (id, status) => {
    try {
      setActionLoading(true);

      const res = await fetch(`${API_URL}/timelogs/${id}/handle-correction`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      notyf.success(`Correction ${status}`);
      fetchAllLogs();

    } catch (err) {
      notyf.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ================= FIX: SAFE LOCAL TIME FORMAT =================
  const formatLocal = (date) => {
    if (!date) return "";

    const d = new Date(date);

    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);

    return local.toISOString().slice(0, 16);
  };

  const toUTC = (val) => (val ? new Date(val).toISOString() : null);

  // ================= EDIT =================
  const handleEditClick = (log) => {
    setEditingId(log._id);

    setFormData({
      timeIn: formatLocal(log.timeIn),
      timeOut: formatLocal(log.timeOut),
      tasks: log.tasks?.join(", ") || "",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (id) => {
    try {
      const res = await fetch(`${API_URL}/timelogs/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeIn: toUTC(formData.timeIn),
          timeOut: toUTC(formData.timeOut),
          tasks: formData.tasks
            ? formData.tasks
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      notyf.success("Time updated");

      setEditingId(null);

      fetchAllLogs();

    } catch (err) {
      notyf.error(err.message || "Update failed");
    }
  };

  useEffect(() => {
    fetchAllLogs();
  }, []);

  // ================= TABLE =================
  const columns = [
    {
      name: "Staff",
      selector: (row) => row.userId?.name || "Unknown",
      cell: (row) => {
        const isActive = !row.timeOut;

        const isToday =
          new Date(row.timeIn).toDateString() ===
          new Date().toDateString();

        return (
          <span
            style={{
              color: isActive
                ? "green"
                : isToday
                ? "blue"
                : "inherit",
              fontWeight: "bold",
            }}
          >
            {row.userId?.name || "Unknown"}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) =>
        new Date(row.timeIn).toLocaleDateString(),
    },
    {
      name: "Time In",
      selector: (row) =>
        row.timeIn
          ? new Date(row.timeIn).toLocaleString()
          : "-",
    },
    {
      name: "Time Out",
      selector: (row) =>
        row.timeOut
          ? new Date(row.timeOut).toLocaleString()
          : "-",
    },
    {
      name: "Total Hours",
      selector: (row) =>
        row.totalTime
          ? row.totalTime.toFixed(2)
          : "-",
    },
    {
      name: "Correction",
      cell: (row) => (
        <span
          style={{
            color:
              row.correctionStatus === "approved"
                ? "green"
                : row.correctionStatus === "disapproved"
                ? "red"
                : row.correctionStatus === "filed"
                ? "orange"
                : "gray",
            fontWeight: "bold",
          }}
        >
          {row.correctionStatus?.toUpperCase()}
        </span>
      ),
    },
    {
      name: "Actions",
      width: "260px",
      cell: (row) => (
        <div className="d-flex gap-2 flex-nowrap align-items-center">

          <Button
            size="sm"
            variant="warning"
            style={{ whiteSpace: "nowrap" }}
            onClick={() => handleEditClick(row)}
          >
            Edit
          </Button>

          {row.correctionStatus === "filed" ? (
            <>
              <Button
                size="sm"
                variant="success"
                disabled={actionLoading}
                onClick={() =>
                  handleCorrectionAction(
                    row._id,
                    "approved"
                  )
                }
              >
                Approve
              </Button>

              <Button
                size="sm"
                variant="danger"
                disabled={actionLoading}
                onClick={() =>
                  handleCorrectionAction(
                    row._id,
                    "disapproved"
                  )
                }
              >
                Reject
              </Button>
            </>
          ) : (
            <span className="text-muted">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Time Logs</h2>

      {/* SEARCH FILTERS */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Control
            type="text"
            placeholder="Search staff name..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />
        </Col>

        <Col md={3}>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) =>
              setStartDate(e.target.value)
            }
          />
        </Col>

        <Col md={3}>
          <Form.Control
            type="date"
            value={endDate}
            onChange={(e) =>
              setEndDate(e.target.value)
            }
          />
        </Col>

        <Col md={2}>
          <Button
            variant="secondary"
            className="w-100"
            onClick={() => {
              setSearchTerm("");
              setStartDate("");
              setEndDate("");
            }}
          >
            Clear
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={filteredLogs}
            pagination
            highlightOnHover
            responsive
            dense
          />

          {/* EDIT PANEL */}
          {editingId && (
            <div className="mt-3 p-3 border rounded">
              <h5>Edit Time</h5>

              <input
                type="datetime-local"
                name="timeIn"
                className="form-control mb-2"
                value={formData.timeIn}
                onChange={handleChange}
              />

              <input
                type="datetime-local"
                name="timeOut"
                className="form-control mb-2"
                value={formData.timeOut}
                onChange={handleChange}
              />

              <input
                type="text"
                name="tasks"
                className="form-control mb-2"
                value={formData.tasks}
                onChange={handleChange}
              />

              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave(editingId)}
                >
                  Save
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default AllTimeLogs;