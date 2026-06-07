import { useEffect, useState, useContext, useMemo, useCallback } from "react";
import UserContext from "../context/UserContext";
import DataTable from "react-data-table-component";

import {
  Container,
  Row,
  Col,
  Spinner,
  Modal,
  Button,
  Form
} from "react-bootstrap";

import "bootstrap-icons/font/bootstrap-icons.css";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;
const notyf = new Notyf();

export default function Items() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [modalContent, setModalContent] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusItemId, setStatusItemId] = useState(null);
  const [statusValue, setStatusValue] = useState("");
  const [byValue, setByValue] = useState("");
  const [notesValue, setNotesValue] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");

  const [addFormData, setAddFormData] = useState({
    itemName: "",
    quantity: "",
    price: "",
    status: "in",
    notes: "",
    by: ""
  });

  // ---------------- AUTH ----------------
  useEffect(() => {
    if (!user?.id) navigate("/login");
  }, [user, navigate]);

  // ---------------- FETCH ----------------
  useEffect(() => {
    fetch(`${API_URL}/items/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
        setItems(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
        setUsers(d);
        setLoadingUsers(false);
      })
      .catch(() => {
        setUsers([]);
        setLoadingUsers(false);
        notyf.error("Failed to load users");
      });
  }, [token]);

  // ---------------- DEBOUNCE SEARCH ----------------
  useEffect(() => {
    const t = setTimeout(() => setSearchText(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ---------------- FILTER ----------------
  const filteredItems = useMemo(() => {
    if (!searchText) return items;

    const q = searchText.toLowerCase();

    return items.filter((i) =>
      `${i.itemName} ${i.status} ${i.notes} ${i.by?.name} ${i.quantity} ${i.price}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, searchText]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) =>
        new Date(b.when || b.createdAt) -
        new Date(a.when || a.createdAt)
    );
  }, [filteredItems]);

  // ---------------- HANDLERS ----------------
  const handleNotesClick = useCallback((note) => {
    setModalContent(note);
    setShowNotesModal(true);
  }, []);

  const handleStatusClick = useCallback((item) => {
    setStatusItemId(item._id);
    setStatusValue(item.status || "");
    setByValue("");
    setNotesValue("");
    setShowStatusModal(true);
  }, []);

  const handleAddChange = (e) => {
    setAddFormData((p) => ({
      ...p,
      [e.target.name]: e.target.value
    }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();

    if (!addFormData.by) return notyf.error("Select a user");

    fetch(`${API_URL}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(addFormData)
    })
      .then((r) => r.json())
      .then((newItem) => {
        setItems((p) => [newItem, ...p]);
        setShowAddModal(false);

        setAddFormData({
          itemName: "",
          quantity: "",
          price: "",
          status: "in",
          notes: "",
          by: ""
        });

        notyf.success("Item added");
      })
      .catch(() => notyf.error("Failed to add item"));
  };

  const handleStatusSave = () => {
    if (!byValue) return notyf.error("Select user");

    fetch(`${API_URL}/items/${statusItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status: statusValue,
        by: byValue,
        notes: notesValue
      })
    })
      .then(() => {
        setShowStatusModal(false);
        notyf.success("Updated");

        return fetch(`${API_URL}/items/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => notyf.error("Update failed"));
  };

  // ---------------- COLUMNS ----------------
  const columns = useMemo(
    () => [
      { name: "Item Name", selector: (r) => r.itemName, sortable: true },
      { name: "Quantity", selector: (r) => r.quantity, sortable: true, width: "120px" },
      { name: "Price", selector: (r) => r.price, sortable: true, width: "120px" },

      {
        name: "Status",
        cell: (r) => (
          <span
            style={{ cursor: "pointer", textDecoration: "underline", color: "green" }}
            onClick={() => handleStatusClick(r)}
          >
            {r.status}
          </span>
        )
      },

      { name: "By", selector: (r) => r.by?.name || "-" },

      {
        name: "Notes",
        cell: (r) =>
          r.notes ? (
            <i
              className="bi bi-eye-fill text-primary"
              style={{ cursor: "pointer" }}
              onClick={() => handleNotesClick(r.notes)}
            />
          ) : (
            "-"
          )
      },

      {
        name: "Added On",
        selector: (r) =>
          new Date(r.when || r.createdAt).toLocaleString(),
        sortable: true
      }
    ],
    [handleStatusClick, handleNotesClick]
  );

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">

      {/* SEARCH + BUTTON */}
      <Row className="mb-3 g-2">
        <Col md={10}>
          <Form.Control
            placeholder="Search items..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </Col>

        <Col md={2} className="d-flex justify-content-end">
          <Button onClick={() => setShowAddModal(true)}>
            Add Item
          </Button>
        </Col>
      </Row>

      {/* TABLE */}
      <Row className="mb-4">
        <Col>
          <DataTable
            columns={columns}
            data={sortedItems}
            pagination
            highlightOnHover
            responsive
            dense
            noDataComponent="No items found"
          />
        </Col>
      </Row>

      {/* NOTES MODAL */}
      <Modal show={showNotesModal} onHide={() => setShowNotesModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Notes</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          {modalContent}
        </Modal.Body>
      </Modal>

      {/* ADD MODAL */}
      {/* ADD MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Item</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: "20px" }}>
          <Form onSubmit={handleAddSubmit}>

            {/* ITEM NAME */}
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                name="itemName"
                placeholder="Enter item name"
                onChange={handleAddChange}
                value={addFormData.itemName}
              />
            </Form.Group>

            {/* QUANTITY */}
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                name="quantity"
                type="number"
                placeholder="Enter quantity"
                onChange={handleAddChange}
                value={addFormData.quantity}
              />
            </Form.Group>

            {/* PRICE */}
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                name="price"
                type="number"
                placeholder="Enter price"
                onChange={handleAddChange}
                value={addFormData.price}
              />
            </Form.Group>

            {/* STATUS (NEW) */}
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={addFormData.status}
                onChange={handleAddChange}
              >
                <option value="in">In</option>
                <option value="out">Out</option>
                <option value="returned">Returned</option>
              </Form.Select>
            </Form.Group>

            {/* BY */}
            <Form.Group className="mb-3">
              <Form.Label>Added By</Form.Label>
              <Form.Select
                name="by"
                value={addFormData.by}
                onChange={handleAddChange}
              >
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* NOTES (ENHANCED) */}
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                placeholder="Optional notes..."
                onChange={handleAddChange}
                value={addFormData.notes}
              />
            </Form.Group>

            <Button type="submit" className="w-100">
              Add Item
            </Button>

          </Form>
        </Modal.Body>
      </Modal>

      {/* STATUS MODAL */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Body style={{ padding: "20px" }}>

          <Form.Select
            className="mb-3"
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
          >
            <option value="in">In</option>
            <option value="out">Out</option>
            <option value="returned">Returned</option>
          </Form.Select>

          <Form.Select
            className="mb-3"
            value={byValue}
            onChange={(e) => setByValue(e.target.value)}
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </Form.Select>

          <Form.Control
            as="textarea"
            rows={3}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="mb-3"
          />

          <Button onClick={handleStatusSave} className="w-100">
            Save
          </Button>

        </Modal.Body>
      </Modal>

    </Container>
  );
}