import { useEffect, useState } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import { Container, Row, Col, Button, Card, Spinner } from "react-bootstrap";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal } from "react-bootstrap";
import { Eye } from "lucide-react";

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

  // TASK VIEW MODAL
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);


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
  const quickClockIn = () => {
    setActionLoading(true);

    fetch(`${API_URL}/timelogs/time-in`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tasks: [] }),
    })
      .then((res) => res.json())
      .then(() => {
        notyf.success("Clock In successful");
        fetchTimeLogs();
      })
      .finally(() => setActionLoading(false));
  };

  const startClockIn = () => {
    setIsPreparingClockIn(true);
    setTasks([]);
    setTaskInput("");
  };

  const handleSubmitClockIn = () => {
    setActionLoading(true);

    fetch(`${API_URL}/timelogs/time-in`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tasks }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to clock in");
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);

        notyf.success("Clock In successful");
        setIsPreparingClockIn(false);
        setTasks([]);
        setTaskInput("");
        fetchTimeLogs();
      })
      .catch((error) => {
        console.log(error);
        notyf.error(error.message || "Clock In failed");
      })
      .finally(() => {
        setActionLoading(false);
      });
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

  const handleFileCorrection = (id) => {
    setActionLoading(true);

    fetch(`${API_URL}/timelogs/${id}/file-correction`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        notyf.success(data.message);
        fetchTimeLogs();
      })
      .catch(() => notyf.error("Error filing correction"))
      .finally(() => setActionLoading(false));
  };

  const handleFileOT = (id) => {
    setActionLoading(true);

    fetch(`${API_URL}/timelogs/${id}/file-ot`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          notyf.success(data.message);
        }

        fetchTimeLogs();
      })
      .catch(() => {
        notyf.error("Error filing OT");
      })
      .finally(() => {
        setActionLoading(false);
      });
  };

  const handleFileHoliday = (id) => {
    setActionLoading(true);

    fetch(`${API_URL}/timelogs/${id}/file-holiday`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          notyf.success(data.message);
        }

        fetchTimeLogs();
      })
      .catch(() => {
        notyf.error("Error filing holiday");
      })
      .finally(() => {
        setActionLoading(false);
      });
  };

  const handleViewTasks = (tasks) => {
    setSelectedTasks(tasks || []);
    setShowTasksModal(true);
  };

  // ================= DATA TABLE =================
const columns = [
  {
    name: "Date",
    selector: (row) =>
      row.timeIn ? new Date(row.timeIn).toLocaleDateString() : "-",
    sortable: true,
  },
  {
    name: "Time In",
    selector: (row) =>
      row.timeIn ? new Date(row.timeIn).toLocaleTimeString() : "-",
  },
  {
    name: "Time Out",
    selector: (row) =>
      row.timeOut ? new Date(row.timeOut).toLocaleTimeString() : "-",
  },
  {
    name: "Total Hours",
    selector: (row) =>
      row.totalTime ? row.totalTime.toFixed(2) : "-",
  },
  {
    name: "Correction",
    cell: (row) => (
      <span
        style={{
          fontWeight: "bold",
          color:
            row.correctionStatus === "approved"
              ? "green"
              : row.correctionStatus === "disapproved"
              ? "red"
              : row.correctionStatus === "filed"
              ? "orange"
              : "gray",
        }}
      >
        {row.correctionStatus.toUpperCase()}
      </span>
    ),
  },
  {
      name: "OT",
      cell: (row) => (
        <span
          style={{
            fontWeight: "bold",
            color:
              row.OT === "approved"
                ? "green"
                : row.OT === "disapproved"
                ? "red"
                : row.OT === "filed"
                ? "orange"
                : "gray",
          }}
        >
          {(row.OT || "none").toUpperCase()}
        </span>
      ),
    },

    {
      name: "Holiday",
      cell: (row) => (
        <span
          style={{
            fontWeight: "bold",
            color:
              row.holiday === "approved"
                ? "green"
                : row.holiday === "disapproved"
                ? "red"
                : row.holiday === "filed"
                ? "orange"
                : "gray",
          }}
        >
          {(row.holiday || "none").toUpperCase()}
        </span>
      ),
    },

 {
   name: "Actions",
   width: "420px",

   cell: (row) => (
     <div
       style={{
         display: "flex",
         gap: "6px",
         flexWrap: "wrap",
       }}
     >
       {/* VIEW */}
       {/*<Button
         size="sm"
         variant="info"
         onClick={() =>
           handleViewTasks(row.tasks)
         }
       >
         <Eye size={16} />
       </Button>*/}

       {/* EDIT */}
       <Button
         size="sm"
         variant="success"
         onClick={() =>
           startEdit(row)
         }
       >
         Notes
       </Button>

       
         <Button
           size="sm"
           variant="warning"
           disabled={actionLoading}
           onClick={() =>
             handleFileCorrection(
               row._id
             )
           }
         >
           Correction
         </Button>
       

       {/* FILE OT */}
       {row.OT === "none" && (
         <Button
           size="sm"
           variant="dark"
           disabled={actionLoading}
           onClick={() =>
             handleFileOT(
               row._id
             )
           }
         >
           File OT
         </Button>
       )}

       {/* FILE HOLIDAY */}
       {row.holiday ===
         "none" && (
         <Button
           size="sm"
           variant="primary"
           disabled={actionLoading}
           onClick={() =>
             handleFileHoliday(
               row._id
             )
           }
         >
           Holiday
         </Button>
       )}
     </div>
   ),
 },
];
  return (
    <>
    <Container className="mt-4">
      <h2 className="text-center mb-3">My Time Logs</h2>

      {/* ================= ACTIONS ================= */}
      <Row className="mb-4 text-center">
        <Col>
          {!isPreparingClockIn ? (
            <>
              <Button variant="primary" className="me-2" onClick={quickClockIn}>
                Clock In
              </Button>

              {/*<Button variant="success" onClick={startClockIn}>
                Clock In
              </Button>*/}
            </>
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
                  }}
                >
                  {task}
                  <span
                    onClick={() => removeTask(index)}
                    style={{ marginLeft: "8px", cursor: "pointer" }}
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
          <h5>Add Notes</h5>

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

      {/* ================= TABLE ================= */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <DataTable
            columns={columns}
            data={logs}
            pagination
            highlightOnHover
            responsive
            striped
            dense
          />
        </div>
      )}
    </Container>

    {/* TASKS MODAL */}
    <Modal
      show={showTasksModal}
      onHide={() => setShowTasksModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Notes</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {selectedTasks.length > 0 ? (
          <ul className="mb-0">
            {selectedTasks.map((task, index) => (
              <li key={index}>{task}</li>
            ))}
          </ul>
        ) : (
          <p className="mb-0 text-white">
            No notes available
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowTasksModal(false)}
        >
          Close
        </Button>
      </Modal.Footer>

    </Modal>
    </>
  );
};

export default MyTimeLogs;