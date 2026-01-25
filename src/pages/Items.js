import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Modal, Button, Form } from "react-bootstrap";

import { Notyf } from "notyf";
import "notyf/notyf.min.css";
const notyf = new Notyf();


const API_URL = process.env.REACT_APP_API_URL;

export default function Items() {

  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Notes modal
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [modalContent, setModalContent] = useState("");

  // Status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusItemId, setStatusItemId] = useState(null);
  const [statusValue, setStatusValue] = useState("");
  const [byValue, setByValue] = useState("");    // <-- add this
  const [notesValue, setNotesValue] = useState(""); // <-- add this


  // Add item modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    itemName: "",
    quantity: "",
    price: "",
    status: "in",
    notes: "",
    by: ""
  });


  const [searchText, setSearchText] = useState(""); // <-- search state
  const [filteredItems, setFilteredItems] = useState([]);



  const token = localStorage.getItem("token");
  // Fetch items on mount
  useEffect(() => {
    fetch(`${API_URL}/items/all`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
	  .then((res) => res.json())
	  .then((data) => {
	    setItems(data);
	    setLoading(false);
	  })
	  .catch(() => {
	    setItems([]);
	    setLoading(false);
	  });

	fetch(`${API_URL}/users`, {
	  headers: {
	    Authorization: `Bearer ${token}`
	  }
	})
	  .then((res) => res.json())
	  .then((data) => {
	    setUsers(data);
	    setLoadingUsers(false);
	  })
	  .catch(() => {
	    setUsers([]);
	    setLoadingUsers(false);
	    notyf.error("Failed to load users");
	  });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/items/all`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
	  .then((res) => res.json())
	  .then((data) => {
	    setItems(data);
	    setLoading(false);
	  })
	  .catch(() => {
	    setItems([]);
	    setLoading(false);
	  });	
  }, [items]);

  useEffect(() => {
    if (!searchText) {
      setFilteredItems(items);
    } else {
      const lowerSearch = searchText.toLowerCase();
      setFilteredItems(
        items.filter(item => {
          // Flatten all values of the item, including nested objects
          const values = Object.values(item).map(val => {
            if (val === null || val === undefined) return "";
            if (typeof val === "object") {
              // If object, flatten its string/number fields
              return Object.values(val)
                .filter(v => v !== null && v !== undefined)
                .map(v => v.toString().toLowerCase())
                .join(" ");
            }
            return val.toString().toLowerCase();
          }).join(" ");

          return values.includes(lowerSearch);
        })
      );
    }
  }, [searchText, items]);





  // Show full note in modal
  const handleNotesClick = (note) => {
    setModalContent(note);
    setShowNotesModal(true);
  };

  // Open status modal
  const handleStatusClick = (item) => {
    setStatusItemId(item._id);
    setStatusValue(item.status);
    setShowStatusModal(true);
  };

  // Save status and update table locally
  const handleStatusSave = () => {
    // Check if a user is selected
    if (!byValue) {
      alert("Please select a user before saving.");
      return; // stop execution
    }

    const token = localStorage.getItem("token");

    fetch(`${API_URL}/items/${statusItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: statusValue, by: byValue, notes: notesValue })
    })
      .then((res) => res.json())
      .then(() => {
        setShowStatusModal(false);

        // Refresh all items
        fetch(`${API_URL}/items/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => res.json())
          .then((data) => setItems(data))
          .catch(() => setItems([]));
      })
      .catch(() => {
        alert("Failed to update item");
      });
  };

  const handleAddChange = (e) => {
    setAddFormData({ ...addFormData, [e.target.name]: e.target.value });
  };


  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!addFormData.by) {
      alert("Please select a user for this item.");
      return;
    }

    fetch(`${API_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(addFormData)
    })
      .then((res) => res.json())
      .then((newItem) => {
        setItems((prev) => [newItem, ...prev]); // append new item
        setShowAddModal(false);
        setAddFormData({
          itemName: "",
          quantity: "",
          price: "",
          status: "in",
          notes: "",
          by: ""
        });
        notyf.success("Item added successfully");
      })
      .catch(() => notyf.error("Failed to add item"));
  };

  // Define columns for DataTable
  
  if (loading)
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );

  return (
      <Container className="mt-4">
        <Row className="align-items-center">
          <Col md={10}>
            <Form.Control
              type="text"
              placeholder="Search items..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mb-3"
            />
          </Col>
          <Col md={2} className="d-flex mb-3 justify-content-end">
            <Button variant="success" onClick={() => setShowAddModal(true)} style={{ whiteSpace: "nowrap" }}>
              Add Item
            </Button>
          </Col>
        </Row>


        <Row className="g-3">
          {filteredItems.length === 0 && <Col><p className="text-center">No items found.</p></Col>}
          {filteredItems.map(item => (
            <Col key={item._id} xs={12} sm={6} md={4}>
              <Card className="h-100 hover-grow">
                <Card.Body className="d-flex flex-column p-3"> {/* reduced padding */}
                  <Card.Title className="mb-1"> {item.itemName}</Card.Title>
                  <Card.Text className="mb-1"> Qty: {item.quantity}</Card.Text>
                  <Card.Text className="mb-1"> Price: {item.price}</Card.Text>
                  <Card.Text className="mb-1">
                    Status: <span className="text-success" style={{cursor:"pointer",  textDecoration:"underline"}} onClick={()=>handleStatusClick(item)}>{item.status}</span>
                  </Card.Text>


                  <Card.Text className="mb-1">
                    By: {item.by ? item.by.name : "-"}
                  </Card.Text>

                  {item.notes && (
                    <Card.Text className="mb-1">
                      Notes:  
                      <span
                        className="text-success d-inline-block" // added d-inline-block
                        style={{
                          cursor: "pointer",
                          color: "green",
                          marginLeft: "10px",
                          textDecoration: "underline",
                          height: "30px",
                          maxWidth: "300px",       // better for longer text
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          verticalAlign: "bottom"
                        }}
                        onClick={() => handleNotesClick(item.notes)}
                      >
                        {item.notes}
                      </span>
                    </Card.Text>
                  )}
                  <Card.Text className="mt-auto" style={{fontSize: "0.75rem"}}>Added On: {new Date(item.when || item.createdAt).toLocaleString()}</Card.Text>
                </Card.Body>
              </Card>
            </Col>

          ))}
        </Row>

        {/* Notes Modal */}
        <Modal show={showNotesModal} onHide={()=>setShowNotesModal(false)}>
          <Modal.Header closeButton><Modal.Title>Full Note</Modal.Title></Modal.Header>
          <Modal.Body>{modalContent}</Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={()=>setShowNotesModal(false)}>Close</Button></Modal.Footer>
        </Modal>

        {/* Add Item Modal */}
        <Modal show={showAddModal} onHide={()=>setShowAddModal(false)}>
          <Modal.Header closeButton><Modal.Title>Add Item</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleAddSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Item Name</Form.Label>
                <Form.Control type="text" name="itemName" value={addFormData.itemName} onChange={handleAddChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantity</Form.Label>
                <Form.Control type="number" name="quantity" value={addFormData.quantity} onChange={handleAddChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price</Form.Label>
                <Form.Control type="number" name="price" value={addFormData.price} onChange={handleAddChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select name="status" value={addFormData.status} onChange={handleAddChange} required>
                  <option value="in">In</option>
                  <option value="out">Out</option>
                  <option value="returned">Returned</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Added By</Form.Label>
                {loadingUsers ? <Spinner animation="border" size="sm" /> : (
                  <Form.Select name="by" value={addFormData.by} onChange={handleAddChange} required>
                    <option value="">Select User</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </Form.Select>
                )}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control as="textarea" rows={3} name="notes" value={addFormData.notes} onChange={handleAddChange} placeholder="Optional" />
              </Form.Group>
              <Button type="submit" variant="success">Add Item</Button>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Status Modal */}
        <Modal show={showStatusModal} onHide={()=>setShowStatusModal(false)}>
          <Modal.Header closeButton><Modal.Title>Edit Status</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={statusValue} onChange={e=>setStatusValue(e.target.value)} required>
                <option value="in">In</option>
                <option value="out">Out</option>
                <option value="returned">Returned</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Updated By</Form.Label>
              <Form.Select value={byValue} onChange={e=>setByValue(e.target.value)}>
                <option value="">Select user</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={3} value={notesValue} onChange={e=>setNotesValue(e.target.value)} placeholder="Add notes (optional)" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={()=>setShowStatusModal(false)}>Cancel</Button>
            <Button variant="success" onClick={handleStatusSave}>Save</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    );
  }

