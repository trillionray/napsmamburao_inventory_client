import { useEffect, useMemo, useState } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";

import {
  Container,
  Spinner,
  Row,
  Col,
  Form,
  Button,
  Card,
} from "react-bootstrap";

import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";

const notyf = new Notyf();

const MyTimeLogsSummary = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTimeLogs();
  }, []);

  const fetchTimeLogs = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/timelogs/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setLogs(data.timelogs || []);
    } catch {
      notyf.error("Failed to fetch time logs");
    } finally {
      setLoading(false);
    }
  };

  // FILTER DATE RANGE
  const filteredLogs = useMemo(() => {
    return logs.filter((row) => {
      if (!row.timeIn) return false;

      const logDate = new Date(row.timeIn);

      if (startDate) {
        const from = new Date(startDate);
        from.setHours(0, 0, 0, 0);

        if (logDate < from) return false;
      }

      if (endDate) {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);

        if (logDate > to) return false;
      }

      return true;
    });
  }, [logs, startDate, endDate]);

  // MAN DAY SUMMARY
  // MAN DAY SUMMARY (GROUP BY DATE)
  const mdSummary = useMemo(() => {
    const grouped = {};

    filteredLogs.forEach((row) => {
      if (!row.timeIn) return;

      const dateKey = new Date(row.timeIn)
        .toISOString()
        .split("T")[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: new Date(row.timeIn).toLocaleDateString(
            "en-US",
            {
              month: "long",
              day: "numeric",
              year: "numeric",
            }
          ),
          hours: 0,
          hasOT: false,
          hasHoliday: false,
        };
      }

      grouped[dateKey].hours += Number(
        row.totalTime || 0
      );

      if (row.OT === "approved") {
        grouped[dateKey].hasOT = true;
      }

      if (row.holiday === "approved") {
        grouped[dateKey].hasHoliday = true;
      }
    });

    const details = Object.entries(grouped)
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateA) - new Date(dateB)
      )
      .map(([_, item]) => {
        let md = 0;

        if (item.hours >= 8) {
          md = 1;
        } else if (item.hours >= 4) {
          md = 0.5;
        } else {
          md = item.hours;
        }

        return {
          date: item.date,
          hours: item.hours,
          md,
          hasOT: item.hasOT,
          hasHoliday: item.hasHoliday,
        };
      });

    const total = details.reduce(
      (sum, item) => sum + item.md,
      0
    );

    const REGULAR_HOURS = 9;

    const totalOT = filteredLogs.reduce((sum, row) => {
      if (row.OT !== "approved") return sum;

      const hours = Number(row.totalTime || 0);

      return sum + Math.max(0, hours - REGULAR_HOURS);
    }, 0);


    const totalHoliday = details.filter(
      (x) => x.hasHoliday
    ).length;

    return {
      details,
      total,
      totalOT,
      totalHoliday,
    };
  }, [filteredLogs]);

  const columns = [
    {
      name: "Date",
      selector: (row) =>
        row.timeIn
          ? new Date(row.timeIn).toLocaleDateString()
          : "-",
      sortable: true,
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
          {(row.correctionStatus || "none").toUpperCase()}
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
      name: "Notes",
      cell: (row) =>
        row.tasks?.length ? (
          <div>
            {row.tasks.map((task, index) => (
              <div key={index}>
                • {task}
              </div>
            ))}
          </div>
        ) : (
          "-"
        ),
      grow: 2,
    },
  ];


  const hasSelectedRange =
    startDate.trim() !== "" ||
    endDate.trim() !== "";

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-3">
        My Time Logs Summary
      </h2>

      {/* FILTER */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>From</Form.Label>

            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
            />
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group>
            <Form.Label>To</Form.Label>

            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
            />
          </Form.Group>
        </Col>

        <Col
          md={4}
          className="d-flex align-items-end"
        >
          <Button
            variant="secondary"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
          >
            Clear
          </Button>
        </Col>
      </Row>

      {/* MD SUMMARY */}
      {hasSelectedRange && (
        <Card className="mb-4 p-3">
          <h5>Total Days Worked</h5>

          {mdSummary.details.length > 0 ? (
            <>
              {mdSummary.details.map((item, index) => (
                <div key={index}>
                  {item.date}
                  {" — "}
                  {item.hours.toFixed(2)} hrs
                  {" : "}

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
                      (with OT)
                    </span>
                  )}

                  {item.hasHoliday && (
                    <span className="ms-2 text-warning">
                      (Holiday)
                    </span>
                  )}
                </div>
              ))}

              <hr />

              <div>
                Total MD:
                <strong>
                  {" "}
                  {mdSummary.total}
                </strong>
              </div>

              <div>
                Approved OT:
                <strong>
                  {" "}
                  {mdSummary.totalOT}
                </strong>
              </div>

              <div>
                Approved Holiday:
                <strong>
                  {" "}
                  {mdSummary.totalHoliday}
                </strong>
              </div>
            </>
          ) : (
            <div>No records found</div>
          )}
        </Card>
      )}

      <div className="mb-2">
        Showing{" "}
        <strong>
          {filteredLogs.length}
        </strong>{" "}
        records
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <DataTable
            columns={columns}
            data={filteredLogs}
            pagination
            highlightOnHover
            responsive
            striped
            dense
            persistTableHead
          />
        </div>
      )}
    </Container>
  );
};

export default MyTimeLogsSummary;