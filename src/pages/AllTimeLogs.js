import { useEffect, useState } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const notyf = new Notyf();

const AllTimeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

                    {/* HEADER */}
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

                     {/* {!log.isPaid ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => markAsPaid(log._id)}
                        >
                          Pay
                        </Button>
                      ) : (
                        <span className="text-success fw-bold">Paid</span>
                      )}*/}
                    </div>

                    <hr />

                    {/* TIME INFO */}
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
                      {log.totalTime ? log.totalTime.toFixed(2) : "-"}
                    </p>

                    {/* TASKS */}
                    <div>
                      <strong>Tasks:</strong>

                      <div className="mt-2">
                        {log.tasks?.length ? (
                          log.tasks.map((task, i) => (
                            <div
                              key={i}
                              style={{
                                background: "#000",
                                color: "#fff",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                marginBottom: "5px",
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
            );
          })}
        </Row>
      )}
    </Container>
  );
};

export default AllTimeLogs;