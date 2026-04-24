import { useEffect, useState } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import { Container, Row, Col, Button, Card, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const notyf = new Notyf();

const MyTimeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isPreparingClockIn, setIsPreparingClockIn] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editTasks, setEditTasks] = useState([]);

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

      const data = await res.json();
      setLogs(data.timelogs || []);
    } catch (error) {
      notyf.error("Failed to fetch time logs");
    } finally {
      setLoading(false);
    }
  };

  // ================= CLOCK IN =================
  const startClockIn = () => {
    setIsPreparingClockIn(true);
    setTasks([]);
    setTaskInput("");
  };

  const handleSubmitClockIn = () => {
    if (tasks.length === 0) {
      notyf.error("Please add at least one task.");
      return;
    }

    setActionLoading(true);

    fetch(`${API_URL}/timelogs/time-in`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tasks }),
    })
      .then((res) => res.json())
      .then(() => {
        notyf.success("Clock In successful");
        setIsPreparingClockIn(false);
        setTasks([]);
        setTaskInput("");
        fetchTimeLogs();
      })
      .finally(() => setActionLoading(false));
  };

  // ================= CLOCK OUT =================
  const handleTimeOut = () => {
    setActionLoading(true);

    fetch(`${API_URL}/timelogs/time-out`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(() => {
        notyf.success("Clock Out successful");
        fetchTimeLogs();
      })
      .finally(() => setActionLoading(false));
  };

  // ================= TASKS =================
  const handleAddTask = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = taskInput.trim();
      if (!value) return;

      setTasks([...tasks, value]);
      setTaskInput("");
    }
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  // ================= EDIT =================
  const startEdit = (row) => {
    setEditId(row._id);
    setEditTasks(row.tasks || []);
  };

  const saveEditTasks = () => {
    setActionLoading(true);

    fetch(`${API_URL}/timelogs/${editId}/tasks`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tasks: editTasks }),
    })
      .then((res) => res.json())
      .then(() => {
        notyf.success("Tasks updated");
        setEditId(null);
        setEditTasks([]);
        fetchTimeLogs();
      })
      .finally(() => setActionLoading(false));
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-3">My Time Logs</h2>

      {/* ================= ACTIONS ================= */}
      <Row className="mb-4 text-center">
        <Col>
          {!isPreparingClockIn ? (
            <Button variant="success" onClick={startClockIn}>
              Clock In
            </Button>
          ) : (
            <>
              <Button variant="primary" className="me-2" onClick={handleSubmitClockIn}>
                Submit Clock In
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setIsPreparingClockIn(false);
                  setTasks([]);
                }}
              >
                Cancel
              </Button>
            </>
          )}

          <Button variant="danger" className="ms-2" onClick={handleTimeOut}>
            Clock Out
          </Button>
        </Col>
      </Row>

      {/* ================= TASK INPUT ================= */}
      {isPreparingClockIn && (
        <Row className="mb-3">
          <Col md={6} className="mx-auto">
            <div className="border rounded p-2 d-flex flex-wrap gap-2">

              {tasks.map((task, index) => (
                <div
                  key={index}
                  style={{
                    background: "#000",
                    color: "#fff",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {task}
                  <span
                    onClick={() => removeTask(index)}
                    style={{
                      marginLeft: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    ×
                  </span>
                </div>
              ))}

              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={handleAddTask}
                placeholder="Add task..."
                style={{ border: "none", outline: "none", flex: 1 }}
              />
            </div>
          </Col>
        </Row>
      )}

      {/* ================= EDIT TASKS ================= */}
      {editId && (
        <Card className="mb-3 p-3">
          <h5>Edit Tasks</h5>

          {editTasks.map((t, i) => (
            <div key={i} className="d-flex mb-2">
              <input
                className="form-control me-2"
                value={t}
                onChange={(e) => {
                  const updated = [...editTasks];
                  updated[i] = e.target.value;
                  setEditTasks(updated);
                }}
              />
              <Button
                variant="danger"
                onClick={() =>
                  setEditTasks(editTasks.filter((_, idx) => idx !== i))
                }
              >
                X
              </Button>
            </div>
          ))}

          <Button onClick={() => setEditTasks([...editTasks, ""])} className="me-2">
            + Add
          </Button>

          <Button variant="success" onClick={saveEditTasks}>
            Save
          </Button>

          <Button variant="secondary" className="ms-2" onClick={() => setEditId(null)}>
            Cancel
          </Button>
        </Card>
      )}

      {/* ================= LOG CARDS ================= */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row>
          {logs.map((log) => (
            <Col key={log._id} xs={12} sm={6} md={4} lg={3} className="mb-3">

              <Card className="shadow-sm h-100">
                <Card.Body>

                 {/* <div className="d-flex justify-content-between">
                    <strong>My Log</strong>
                    <Button size="sm" onClick={() => startEdit(log)}>
                      Edit
                    </Button>
                  </div>

                  <hr />*/}

                  <p><strong>Time In:</strong><br />{new Date(log.timeIn).toLocaleString()}</p>
                  <p><strong>Time Out:</strong><br />{log.timeOut ? new Date(log.timeOut).toLocaleString() : "-"}</p>
                  <p><strong>Total Hours:</strong><br />{log.totalTime ? log.totalTime.toFixed(2) : "-"}</p>

                  {/* ================= TASK UI UPDATED ================= */}
                  <div>
                    <strong>Tasks:</strong>

                    <div className="mt-2 d-flex flex-column gap-2">
                      {log.tasks?.length ? (
                        log.tasks.map((task, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#000",
                              color: "#fff",
                              padding: "6px 10px",
                              borderRadius: "8px",
                              fontSize: "14px",
                            }}
                          >
                            • {task}
                          </div>
                        ))
                      ) : (
                        <span className="text-muted">No tasks</span>
                      )}
                    </div>
                  </div>

                </Card.Body>
              </Card>

            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MyTimeLogs;