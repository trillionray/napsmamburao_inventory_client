import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";

const OrdersPage = () => {
  const { user } = useContext(UserContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [orderName, setOrderName] = useState("");
  const [serviceType, setServiceType] = useState("dinein");

  const navigate = useNavigate();

  // ==============================
  // FETCH ALL ORDERS
  // ==============================
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${process.env.REACT_APP_API_URL2}/orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      console.log("ORDERS:", data);

      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ==============================
  // CREATE ORDER
  // ==============================
  const handleCreateOrder = async () => {
    if (!orderName) {
      alert("Please enter order name");
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL2}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          staffName: user.name,
          orderName,
          serviceType,
        }),
      });

      const data = await res.json();
      console.log("Created:", data);

      fetchOrders();

      setOrderName("");
      setServiceType("dinein");
    } catch (err) {
      console.error("Error creating order:", err);
    }
  };

  // ==============================
  // SELECT ORDER
  // ==============================
  const handleSelectOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  // ==============================
  // LOADING SAFETY
  // ==============================
  if (!user || !user.name) {
    return <p>Loading user...</p>;
  }

  return (
    <div className="container mt-4">

      <h2>Orders</h2>
      <p>Staff: {user.name}</p>

      {/* ==============================
          CREATE ORDER
      ============================== */}
      <div className="card p-3 mb-4">
        <h5>Create Order</h5>

        <input
          type="text"
          placeholder="Order Label"
          className="form-control mb-2"
          value={orderName}
          onChange={(e) => setOrderName(e.target.value)}
        />

        <select
          className="form-control mb-2"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          <option value="dinein">Dine-in</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
          <option value="reservation">Reservation</option>
        </select>

        <button className="btn btn-primary" onClick={handleCreateOrder}>
          Create Order
        </button>
      </div>

      {/* ==============================
          ORDER LIST
      ============================== */}
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="row">
          {orders.length === 0 ? (
            <p>No orders available</p>
          ) : (
            orders.map((order) => (
              <div className="col-md-3 mb-3" key={order._id}>
                <div
                  className="card p-3 h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSelectOrder(order._id)}
                >
                  <h5>{order.orderName}</h5>

                  <p>Staff: {order.staffName}</p>
                  <p>Type: {order.serviceType}</p>

                  <hr />

                  <p>Subtotal: ₱{order.subtotal}</p>
                  <p>Discount: ₱{order.discount}</p>

                  <p className="fw-bold">
                    Grand Total: ₱{order.grandTotal}
                  </p>

                  <p>
                    Status:{" "}
                    <span
                      className={
                        order.status === "billed"
                          ? "text-success"
                          : "text-warning"
                      }
                    >
                      {order.status}
                    </span>
                  </p>

                  <small>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : "N/A"}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default OrdersPage;