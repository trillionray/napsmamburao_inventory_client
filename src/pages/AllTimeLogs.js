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

  // ✅ Fetch logs
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

  // ✅ Convert DB date → input (LOCAL TIME)
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

  // ✅ Convert input → UTC (CRITICAL FIX)
  const toUTCISOString = (localDateTime) => {
    if (!localDateTime) return null;
    return new Date(localDateTime).toISOString();
  };

  // ✅ Edit click
  const handleEditClick = (log) => {
    setEditingId(log._id);

    setFormData({
      timeIn: formatForInput(log.timeIn),
      timeOut: formatForInput(log.timeOut),
      tasks: log.tasks?.join(", ") || ""
    });
  };

  // ✅ Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ✅ Save update
  const handleSave = async (id) => {
    try {

      // 🔒 Validate time
      if (formData.timeIn && formData.timeOut) {
        if (new Date(formData.timeOut) < new Date(formData.timeIn)) {
          notyf.error("Time Out cannot be earlier than Time In");
          return;
        }
      }

      const res = await fetch(`${API_URL}/timelogs/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // 🔥 FIXED: send UTC
          timeIn: toUTCISOString(formData.timeIn),
          timeOut: toUTCISOString(formData.timeOut),

          // 🔥 FIXED: clean tasks
          tasks: formData.tasks
            ? formData.tasks.split(",").map(t => t.trim()).filter(Boolean)
            : []
        }),
      });

      const data = await res.json();
      console.log(data);

      if (!res.ok) throw new Error(data.message || "Update failed");

      notyf.success("Updated successfully");
      setEditingId(null);
      fetchAllLogs();

    } catch (err) {
      console.error(err);
      notyf.error(err.message || "Update failed");
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
              <Col key={log._id} xs={12} sm={6} md={4} lg={3} className="mb-3">
                <Card className="shadow-sm h-100">
                  <Card.Body>

                    {/* HEADER */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
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
                        <div className="w-100 d-flex justify-content-end mt-2 mt-md-0">
                          <Button
                            className="bg-warning text-dark border-0"
                            size="sm"
                            onClick={() => handleEditClick(log)}
                          >
                            Correction
                          </Button>
                        </div>
                      )}
                    </div>

                    <hr />

                    {/* CONTENT */}
                    {editingId === log._id ? (
                      <>
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
                          <strong>Tasks:</strong>
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
                        <p className="mb-1">
                          <strong className="text-info">Time In:</strong>{" "}
                          {log.timeIn
                            ? new Date(log.timeIn).toLocaleString()
                            : "-"}
                        </p>

                        <p className="mb-1">
                          <strong className="text-info">Time Out:</strong>{" "}
                          {log.timeOut
                            ? new Date(log.timeOut).toLocaleString()
                            : "-"}
                        </p>

                        <p className="mb-2">
                          <strong className="text-info">Total Hours:</strong>{" "}
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