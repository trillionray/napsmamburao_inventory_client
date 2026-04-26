import { useEffect, useState } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const notyf = new Notyf();

const AllTimeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);


  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    timeIn: "",
    timeOut: "",
    tasks: ""
  });


  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  const fetchAllLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/timelogs/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
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

      notyf.success("Marked as paid");
      fetchAllLogs();
    } catch (error) {
      console.error(error);
      notyf.error("Unable to update paid status");
    }
  };


  const formatForInput = (date) => {
    if (!date) return "";

    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };


  const handleEditClick = (log) => {
    setEditingId(log._id);

    setFormData({
      timeIn: formatForInput(log.timeIn),
      timeOut: formatForInput(log.timeOut),
      tasks: log.tasks?.join(", ") || ""
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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
        timeIn: formData.timeIn,
        timeOut: formData.timeOut,
        tasks: formData.tasks.split(",").map(t => t.trim())
      }),
    });

    const data = await res.json(); // 👈 ADD THIS
    console.log(data)

    if (!res.ok) throw new Error();

    notyf.success("Updated successfully");
    setEditingId(null);
    fetchAllLogs();

  } catch (err) {
    console.log(err)
    notyf.error("Update failed");
  }
};


  useEffect(() => {
    fetchAllLogs();
  }, []);

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Time Logs</h2>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row>
          {logs.map((log) => {
            const timeIn = new Date(log.timeIn);
            const today = new Date();

            const isActive =
              timeIn.getDate() === today.getDate() &&
              timeIn.getMonth() === today.getMonth() &&
              timeIn.getFullYear() === today.getFullYear() &&
              !log.timeOut;

            return (
              <Col key={log._id} xs={6} sm={6} md={4} lg={3} className="mb-3">
                <Card className="shadow-sm h-100">
                  <Card.Body>

                    {/* ✅ HEADER (ALWAYS VISIBLE) */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6
                          style={{
                            color: isActive ? "green" : "white",
                            fontWeight: isActive ? "bold" : "normal",
                            marginBottom: 0,
                          }}
                        >
                          {log.userId?.name || "Unknown User"}
                        </h6>

                        <small className="text-muted">
                          {log.userId?.email}
                        </small>
                      </div>

                      {editingId !== log._id && (
                        <Button
                          size="sm"
                          onClick={() => handleEditClick(log)}
                        >
                          Time Correction
                        </Button>
                      )}
                    </div>

                    <hr />

                    {/* 🔁 CONTENT (TOGGLES) */}
                    {editingId === log._id ? (
                      <>
                        {/* EDIT MODE */}

                        <div className="mb-2">
                          <strong>Time In:</strong>
                          <input
                            type="datetime-local"
                            name="timeIn"
                            value={formData.timeIn}
                            onChange={handleChange}
                            className="form-control"
                          />
                        </div>

                        <div className="mb-2">
                          <strong>Time Out:</strong>
                          <input
                            type="datetime-local"
                            name="timeOut"
                            value={formData.timeOut}
                            onChange={handleChange}
                            className="form-control"
                          />
                        </div>

                        <div className="mb-2">
                          <strong>Tasks (comma separated):</strong>
                          <input
                            type="text"
                            name="tasks"
                            value={formData.tasks}
                            onChange={handleChange}
                            className="form-control"
                          />
                        </div>

                        <div className="d-flex gap-2 mt-2">
                          <Button size="sm" onClick={() => handleSave(log._id)}>
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
                      </>
                    ) : (
                      <>
                        {/* VIEW MODE */}

                        <p className="mb-1">
                          <strong>Time In:</strong>{" "}
                          {log.timeIn
                            ? new Date(log.timeIn).toLocaleString()
                            : "-"}
                        </p>

                        <p className="mb-1">
                          <strong>Time Out:</strong>{" "}
                          {log.timeOut
                            ? new Date(log.timeOut).toLocaleString()
                            : "-"}
                        </p>

                        <p className="mb-2">
                          <strong>Total Hours:</strong>{" "}
                          {log.totalTime
                            ? log.totalTime.toFixed(2)
                            : "-"}
                        </p>

                        <div>
                          <strong>Tasks:</strong>
                          <div className="mt-2">
                            {log.tasks?.length ? (
                              log.tasks.map((task, i) => (
                                <div
                                  key={i}
                                  className="bg-dark text-white p-2 rounded mb-1"
                                >
                                  • {task}
                                </div>
                              ))
                            ) : (
                              <span className="text-muted">No tasks</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
};

export default AllTimeLogs;