import { useEffect, useState, useMemo } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";

import {
  Container,
  Spinner,
  Row,
  Col,
  Form,
} from "react-bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";
import DataTable from "react-data-table-component";

const notyf = new Notyf();

const Payroll = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [holidayTypes, setHolidayTypes] = useState({});

  const hasRange = startDate || endDate;

  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  // ================= FETCH =================
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      try {
        const [res1, res2] = await Promise.all([
          fetch(`${API_URL}/timelogs/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/salaries/all-current`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const logsData = await res1.json();
        const salaryData = await res2.json();

        setLogs(logsData.timelogs || []);
        setFilteredLogs(logsData.timelogs || []);
        setSalaries(Array.isArray(salaryData) ? salaryData : []);
      } catch {
        notyf.error("Fetch failed");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ================= FILTER =================
  useEffect(() => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter((log) =>
        log.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (startDate) {
      const from = new Date(startDate);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter((log) => new Date(log.timeIn) >= from);
    }

    if (endDate) {
      const to = new Date(endDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => new Date(log.timeIn) <= to);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, startDate, endDate, logs]);

  // ================= SALARY MAP =================
  const salaryMap = useMemo(() => {
    const map = new Map();
    salaries.forEach((s) => {
      map.set(String(s.userId), {
        salary: Number(s.salary || 0),
        allowances: Number(s.allowances || 0),
      });
    });
    return map;
  }, [salaries]);

  const getSalary = (id) =>
    salaryMap.get(String(id)) || { salary: 0, allowances: 0 };

  // ================= CORE ENGINE =================
  const summary = useMemo(() => {
    const grouped = {};

    filteredLogs.forEach((row) => {
      if (!row.timeIn) return;

      const userId = row.userId?._id;
      const d = new Date(row.timeIn);

      const date =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");

      const key = `${userId}-${date}`;

      const hours = Number(row.totalTime || 0);

      if (!grouped[key]) {
        grouped[key] = {
          key,
          date,
          userId,
          totalHours: 0,
          otHours: 0,
          hasOT: false,
          hasHoliday: false,
        };
      }

      const g = grouped[key];

      g.totalHours += hours;

      // ================= ONLY APPROVED OT =================
      if (row.OT === "approved") {
        const ot = Math.max(0, hours - 9);
        g.otHours += ot;
        if (ot > 0) g.hasOT = true;
      }

      if (row.holiday === "approved") {
        g.hasHoliday = true;
      }
    });

    const details = Object.values(grouped).map((item) => {
      const { salary, allowances } = getSalary(item.userId);
      const hourlyRate = salary / 8;

      // ================= MD =================
      let md = 0;

      if (item.totalHours >= 8) {
        md = 1;
      } else if (item.totalHours >= 4 && item.totalHours >= 5.4) {
        md = 0.5;
      } else {
        md = item.totalHours / 8;
      }

      let basePay = 0;

      if (item.totalHours >= 8) {
        basePay = salary; // full day
      } else if (item.totalHours >= 4 && item.totalHours >= 5.4) {
        basePay = salary * 0.5; // half day
      } else {
        basePay = item.totalHours * hourlyRate;
      }

      // ================= OT PAY =================
      const otPay = item.otHours * hourlyRate * 1.25;

      // ================= HOLIDAY =================
      const holidayType = holidayTypes[item.key] || "none";

      let holidayPay = 0;
      if (item.hasHoliday) {
        if (holidayType === "regular") {
          holidayPay = basePay; // +100%
        } else if (holidayType === "special") {
          holidayPay = basePay * 0.3;
        }
      }

      const total = basePay + otPay + holidayPay + allowances;

      return {
        ...item,
        md,
        basePay,
        otHours: item.otHours,
        otPay,
        holidayPay,
        payroll: total,
        staffCount: 1,
      };
    });

    return {
      details,
      totalMD: details.reduce((a, b) => a + b.md, 0),
      totalOT: details.reduce((a, b) => a + b.otHours, 0),
      totalHoliday: details.filter(d => d.hasHoliday).length,
      totalPayroll: details.reduce((a, b) => a + b.payroll, 0),
    };
  }, [filteredLogs, salaryMap, holidayTypes]);

  const updateHolidayType = (key, value) => {
    setHolidayTypes((prev) => ({ ...prev, [key]: value }));
  };

  // ================= UI =================
  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Payroll System</h2>

      {/* FILTERS */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Control
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>

        <Col md={3}>
          <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Col>

        <Col md={3}>
          <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Col>
      </Row>

      {/* SUMMARY */}
      {hasRange && (
        <div className="border p-3 mb-3">
          <h5>Summary</h5>

          {summary.details.map((item) => (
            <div key={item.key} className="mb-2">
              <strong>{item.date}</strong> —

              {item.totalHours.toFixed(2)} hrs |
              MD {item.md.toFixed(2)} |

              {item.hasOT && (
                <span className="ms-2 text-warning fw-bold">OT</span>
              )}

              {item.hasHoliday && (
                <>
                  <span className="ms-2 text-danger fw-bold">HOLIDAY</span>

                  <select
                    className="ms-2"
                    value={holidayTypes[item.key] || "none"}
                    onChange={(e) => updateHolidayType(item.key, e.target.value)}
                  >
                    <option value="none">Select Holiday Type</option>
                    <option value="regular">Regular</option>
                    <option value="special">Special</option>
                  </select>
                </>
              )}

              <div>
                Total: <b>₱{item.payroll.toFixed(2)}</b>
              </div>
            </div>
          ))}

          <hr />

          <div>Total MD: <b>{summary.totalMD.toFixed(2)}</b></div>
          <div>Total OT Hours: <b>{summary.totalOT.toFixed(2)}</b></div>
          <div>Total Holiday: <b>{summary.totalHoliday}</b></div>
          <div>Total Payroll: <b>₱{summary.totalPayroll.toFixed(2)}</b></div>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <DataTable
          columns={[
            { name: "Staff", selector: r => r.userId?.name },
            { name: "Date", selector: r => new Date(r.timeIn).toLocaleDateString() },
            { name: "Hours", selector: r => r.totalTime },
            { name: "OT", selector: r => r.OT === "approved" ? "YES" : "NO" },
            { name: "Holiday", selector: r => r.holiday === "approved" ? "YES" : "NO" },
          ]}
          data={filteredLogs}
          pagination
        />
      )}
    </Container>
  );
};

export default Payroll;