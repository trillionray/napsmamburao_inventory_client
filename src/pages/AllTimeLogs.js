import { useEffect, useState, useMemo } from "react";
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
import { Modal } from "react-bootstrap";
import { Eye } from "lucide-react";


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

  const [showRejectModal, setShowRejectModal] =
    useState(false);

  const [rejectId, setRejectId] =
    useState(null);

  const [rejectType, setRejectType] =
    useState("correction");

  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  // TASK MODAL
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);

  const [showApproveModal, setShowApproveModal] =
    useState(false);

  const [approveId, setApproveId] =
    useState(null);

  const [approveType, setApproveType] =
    useState("correction");

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
      const from = new Date(startDate);
      from.setHours(0, 0, 0, 0);

      filtered = filtered.filter(
        (log) => new Date(log.timeIn) >= from
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


  const hasSelectedRange =
    startDate.trim() !== "" ||
    endDate.trim() !== "";

  const summary = useMemo(() => {
    const grouped = {};

    filteredLogs.forEach((row) => {
      if (!row.timeIn) return;

      const key = new Date(row.timeIn)
        .toISOString()
        .split("T")[0];

      if (!grouped[key]) {
        grouped[key] = {
          date: new Date(
            row.timeIn
          ).toLocaleDateString(
            "en-US",
            {
              month: "long",
              day: "numeric",
              year: "numeric",
            }
          ),
          hours: 0,
          staff: new Set(),
          hasOT: false,
          hasHoliday: false,
        };
      }

      grouped[key].hours += Number(
        row.totalTime || 0
      );

      grouped[key].staff.add(
        row.userId?.name ||
          "Unknown"
      );

      if (row.OT === "approved") {
        grouped[key].hasOT = true;
      }

      if (
        row.holiday ===
        "approved"
      ) {
        grouped[key].hasHoliday = true;
      }
    });

    const details = Object.entries(grouped)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([_, item]) => {
        let md = 0;

        if (item.hours >= 8) {
          md = 1;
        } else if (item.hours >= 4) {
          md = 0.5;
        } else {
          md = 0;
        }

        // ONLY COUNT OT IF APPROVED
        const otHours =
          item.hasOT && item.hours > 9
            ? item.hours - 9
            : 0;

        return {
          ...item,
          md,
          otHours,
          staffCount: item.staff.size,
        };
      });

    return {
      details,
      totalMD:
        details.reduce(
          (a, b) =>
            a + b.md,
          0
        ),

      totalOT: details.reduce(
        (sum, item) => sum + (item.otHours || 0),
        0
      ).toFixed(2),

      totalHoliday:
        details.filter(
          (x) =>
            x.hasHoliday
        ).length,
    };
  }, [filteredLogs]);
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

    const handleViewTasks = (tasks) => {
      setSelectedTasks(tasks || []);
      setShowTasksModal(true);
    };

  const handleApprove = async () => {
    try {
      setActionLoading(true);

      const endpoints = {
        correction:
          `${API_URL}/timelogs/${approveId}/handle-correction`,
        ot:
          `${API_URL}/timelogs/${approveId}/handle-ot`,
        holiday:
          `${API_URL}/timelogs/${approveId}/handle-holiday`,
      };

      const res = await fetch(
        endpoints[approveType],
        {
          method: "PATCH",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: "approved",
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message
        );
      }

      notyf.success(
        `${approveType.toUpperCase()} approved`
      );

      setShowApproveModal(false);

      fetchAllLogs();

    } catch (err) {
      notyf.error(
        err.message ||
          "Approve failed"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);

      const endpoints = {
        correction:
          `${API_URL}/timelogs/${rejectId}/handle-correction`,
        ot:
          `${API_URL}/timelogs/${rejectId}/handle-ot`,
        holiday:
          `${API_URL}/timelogs/${rejectId}/handle-holiday`,
      };

      const res = await fetch(
        endpoints[rejectType],
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: "disapproved",
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message
        );
      }

      notyf.success(
        `${rejectType.toUpperCase()} rejected`
      );

      setShowRejectModal(false);

      fetchAllLogs();

    } catch (err) {
      notyf.error(
        err.message ||
          "Reject failed"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    // ✅ SORT BY DATE ASCENDING
    const sortedLogs = [...filteredLogs].sort(
      (a, b) => new Date(a.timeIn) - new Date(b.timeIn)
    );

    const html = `
      <html>
        <head>
          <title>Time Logs Summary</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { text-align: center; margin-bottom: 5px; }

            .meta {
              text-align: center;
              margin-bottom: 20px;
              font-size: 14px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th, td {
              border: 1px solid #000;
              padding: 8px;
              font-size: 12px;
            }

            th {
              background: #f2f2f2;
            }

            .summary {
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>

        <body>

          <h2>Time Logs Summary</h2>

          <div class="meta">
  
            <div>
              <strong>From:</strong> ${startDate || "N/A"} |
              <strong>To:</strong> ${endDate || "N/A"}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Hours</th>
                <th>OT</th>
                <th>Holiday</th>
              </tr>
            </thead>

            <tbody>
              ${sortedLogs
                .map((row) => {
                  return `
                  <tr>
                    <td>${row.userId?.name || "Unknown"}</td>
                    <td>${row.timeIn ? new Date(row.timeIn).toLocaleDateString() : "-"}</td>
                    <td>${row.timeIn ? new Date(row.timeIn).toLocaleTimeString() : "-"}</td>
                    <td>${row.timeOut ? new Date(row.timeOut).toLocaleTimeString() : "-"}</td>
                    <td>${row.totalTime ? row.totalTime.toFixed(2) : "-"}</td>
                    <td>${row.OT === "approved" ? "YES" : "NO"}</td>
                    <td>${row.holiday === "approved" ? "YES" : "NO"}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>

          <div class="summary">
 
            <p>Total MD: ${summary.totalMD}</p>
            <p>Total OT: ${summary.totalOT}</p>
            <p>Total Holiday: ${summary.totalHoliday}</p>
          </div>

        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

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
          ? new Date(row.timeIn).toLocaleTimeString()
          : "-",
    },
    {
      name: "Time Out",
      selector: (row) =>
        row.timeOut
          ? new Date(row.timeOut).toLocaleTimeString()
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
      name: "OT",
      cell: (row) => (
        <span
          style={{
            color:
              row.OT === "approved"
                ? "green"
                : row.OT === "disapproved"
                ? "red"
                : row.OT === "filed"
                ? "orange"
                : "gray",
            fontWeight: "bold",
          }}
        >
          {row.OT?.toUpperCase()}
        </span>
      ),
    },

    {
      name: "Holiday",
      cell: (row) => (
        <span
          style={{
            color:
              row.holiday === "approved"
                ? "green"
                : row.holiday === "disapproved"
                ? "red"
                : row.holiday === "filed"
                ? "orange"
                : "gray",
            fontWeight: "bold",
          }}
        >
          {row.holiday?.toUpperCase()}
        </span>
      ),
    },
    {
      name: "Actions",

      width: "380px",

      cell: (row) => (
        <div className="d-flex gap-2 flex-wrap">

          <Button
            size="sm"
            variant="info"
            onClick={() =>
              handleViewTasks(
                row.tasks
              )
            }
          >
            <Eye size={16} />
          </Button>

          <Button
            size="sm"
            variant="warning"
            onClick={() =>
              handleEditClick(
                row
              )
            }
          >
            Edit
          </Button>

          {/* APPROVE */}
          <Button
            size="sm"
            variant="success"
            disabled={
              actionLoading
            }
            onClick={() => {
              setApproveId(
                row._id
              );

              setApproveType(
                "correction"
              );

              setShowApproveModal(
                true
              );
            }}
          >
            Approve
          </Button>

          {/* REJECT */}
          <Button
            size="sm"
            variant="danger"
            disabled={
              actionLoading
            }
            onClick={() => {
              setRejectId(
                row._id
              );

              setRejectType(
                "correction"
              );

              setShowRejectModal(
                true
              );
            }}
          >
            Reject
          </Button>

        </div>
      ),
    },

  ];

  return (
    <>
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

        <Col md={2}>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) =>
              setStartDate(e.target.value)
            }
          />
        </Col>

        <Col md={2}>
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

        <Col md={2} className="ms-auto d-flex justify-content-end">          <Button
            variant="success"
            className="mb-3"
            onClick={handlePrint}
          >
            Print Summary
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>

        {hasSelectedRange && (
          <div className="mb-4">

            <div className="border rounded p-3">

              <h5>
                Summary
              </h5>

              {summary.details
                .length >
              0 ? (
                <>
                  {summary.details.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="mb-2"
                      >
                        <strong>
                          {
                            item.date
                          }
                        </strong>

                        {" — "}

                        {
                          item.staffCount
                        }{" "}
                        staff

                        {" • "}

                        {item.hours.toFixed(
                          2
                        )}{" "}
                        hrs

                        {" • "}

                        <strong
                          style={{
                            color:
                              item.md <= 0.5
                                ? "red"
                                : "inherit",
                          }}
                        >
                          {item.md} MD
                        </strong>

                        {item.hasOT && (
                          <span className="ms-2 text-warning">
                            with OT
                          </span>
                        )}

                        {item.hasHoliday && (
                          <span className="ms-2 text-warning">
                            Holiday
                          </span>
                        )}
                      </div>
                    )
                  )}

                  <hr />

                  <div>
                    Total MD:
                    <strong>
                      {" "}
                      {
                        summary.totalMD
                      } MD
                    </strong>
                  </div>

                  <div>
                    Total OT:
                    <strong>
                      {" "}
                      {
                        summary.totalOT
                      }
                    </strong>
                  </div>

                  <div>
                    Holiday:
                    <strong>
                      {" "}
                      {
                        summary.totalHoliday
                      } MD
                    </strong>
                  </div>
                </>
              ) : (
                <div>
                  No records
                </div>
              )}

            </div>

          </div>
        )}
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
          <p className="mb-0 text-white">No tasks available</p>
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

    <Modal
      show={showApproveModal}
      onHide={() =>
        setShowApproveModal(false)
      }
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Approve Request
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>

        <Form.Group>

          <Form.Label>
            Select request
          </Form.Label>

          <Form.Select
            value={approveType}
            onChange={(e) =>
              setApproveType(
                e.target.value
              )
            }
          >
            <option value="correction">
              Correction
            </option>

            <option value="ot">
              OT
            </option>

            <option value="holiday">
              Holiday
            </option>

          </Form.Select>

        </Form.Group>

      </Modal.Body>

      <Modal.Footer>

        <Button
          variant="secondary"
          onClick={() =>
            setShowApproveModal(
              false
            )
          }
        >
          Cancel
        </Button>

        <Button
          variant="success"
          disabled={
            actionLoading
          }
          onClick={
            handleApprove
          }
        >
          Confirm Approve
        </Button>

      </Modal.Footer>

    </Modal>

    <Modal
      show={showRejectModal}
      onHide={() =>
        setShowRejectModal(false)
      }
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Reject Request
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>

        <Form.Group>
          <Form.Label>
            Select request
          </Form.Label>

          <Form.Select
            value={rejectType}
            onChange={(e) =>
              setRejectType(
                e.target.value
              )
            }
          >
            <option value="correction">
              Correction
            </option>

            <option value="ot">
              OT
            </option>

            <option value="holiday">
              Holiday
            </option>
          </Form.Select>

        </Form.Group>

      </Modal.Body>

      <Modal.Footer>

        <Button
          variant="secondary"
          onClick={() =>
            setShowRejectModal(false)
          }
        >
          Cancel
        </Button>

        <Button
          variant="danger"
          disabled={actionLoading}
          onClick={handleReject}
        >
          Confirm Reject
        </Button>

      </Modal.Footer>

    </Modal>
    </>


  );
};

export default AllTimeLogs;