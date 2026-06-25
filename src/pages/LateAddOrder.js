import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";

const LateAddOrder = () => {
const { user } = useContext(UserContext);
const navigate = useNavigate();

const [orderName, setOrderName] = useState("");
const [serviceType, setServiceType] = useState("dinein");
const [pax, setPax] = useState(1);
const [timestamp, setTimestamp] = useState("");
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

const handleCreateLateOrder = async () => {
if (!orderName) {
alert("Please enter order name");
return;
}

if (!timestamp) {
  alert("Please select date and time");
  return;
}

if (pax < 1) {
  alert("PAX must be at least 1");
  return;
}

try {
  setLoading(true);

  const res = await fetch(`${process.env.REACT_APP_API_URL2}/orders/late`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({
      staffName: user.name,
      orderName,
      serviceType,
      pax,
      timestamp: new Date(timestamp).toISOString(),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create late order");
  }

  setMessage("Late order created successfully.");

  setOrderName("");
  setServiceType("dinein");
  setPax(1);
  setTimestamp("");

  if (data?._id) {
    navigate(`/orders/${data._id}`);
  }
} catch (err) {
  console.error(err);
  setMessage(err.message);
} finally {
  setLoading(false);
}

};

if (!user || !user.name) {
return <p>Loading user...</p>;
}

return (
<div className="container mt-4">
<h2>Add Late Order</h2>

  <p>
    <strong>Staff:</strong> {user.name}
  </p>

  {message && <div className="alert alert-info">{message}</div>}

  <div className="card p-3">
    <div className="row mb-3">
      <div className="col-md-4">
        <label>Order Label</label>
      </div>
      <div className="col-md-8">
        <input
          type="text"
          className="form-control"
          value={orderName}
          onChange={(e) => setOrderName(e.target.value)}
        />
      </div>
    </div>

    <div className="row mb-3">
      <div className="col-md-4">
        <label>Service Type</label>
      </div>
      <div className="col-md-8">
        <select
          className="form-control"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          <option value="dinein">Dine-in</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
          <option value="reservation">Reservation</option>
        </select>
      </div>
    </div>

    <div className="row mb-3">
      <div className="col-md-4">
        <label>PAX</label>
      </div>
      <div className="col-md-8">
        <input
          type="number"
          min="1"
          className="form-control"
          value={pax}
          onChange={(e) => setPax(Number(e.target.value))}
        />
      </div>
    </div>

    <div className="row mb-4">
      <div className="col-md-4">
        <label>Date & Time</label>
      </div>
      <div className="col-md-8">
        <input
          type="datetime-local"
          className="form-control"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
        />
      </div>
    </div>

    <button
      className="btn btn-primary"
      onClick={handleCreateLateOrder}
      disabled={loading}
    >
      {loading ? "Saving..." : "Create Late Order"}
    </button>
  </div>
</div>

);
};

export default LateAddOrder;