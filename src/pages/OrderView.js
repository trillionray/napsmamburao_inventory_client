import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const OrdersView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState({
    ordered: [],
    subtotal: 0,
    discount: 0,
    grandTotal: 0,
    pax: 1,
    discountedPax: 0,
    cash: 0,
    status: "pending",
  });

  const [menu, setMenu] = useState([]);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  // billing inputs
  const [pax, setPax] = useState(1);
  const [discountedPax, setDiscountedPax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [showDiscount, setShowDiscount] = useState(false);

  const [cash, setCash] = useState(0);

  const change = Number(cash || 0) - Number(order.grandTotal || 0);
  // ==============================
  // NORMALIZER
  // ==============================
  const normalizeOrder = (data) => ({
    ...data,
    ordered: Array.isArray(data?.ordered) ? data.ordered : [],
    subtotal: Number(data?.subtotal || 0),
    discount: Number(data?.discount || 0),
    grandTotal: Number(data?.grandTotal || 0),
    pax: Number(data?.pax || 1),
    discountedPax: Number(data?.discountedPax || 0),
    cash: Number(data?.cash || 0),
    status: data?.status || "pending",
  });

  // ==============================
  // FETCH ORDER
  // ==============================
  const fetchOrder = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.REACT_APP_API_URL2}/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      const normalized = normalizeOrder(data);

      setOrder(normalized);

      setPax(normalized.pax);
      setDiscountedPax(normalized.discountedPax);
      setDiscount(normalized.discount);
      setCash(normalized.cash || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // LOAD MENU
  // ==============================
  const loadMenu = async () => {
    const res =
      order?.serviceType?.toLowerCase() === "delivery"
        ? await import("../deliveryMenu")
        : await import("../menuData");

    setMenu(res.default);
    setFilteredMenu(res.default);
  };

  useEffect(() => {
    if (order?.serviceType) loadMenu();
  }, [order?.serviceType]);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // ==============================
  // SEARCH MENU
  // ==============================
  useEffect(() => {
    const keyword = search.toLowerCase();

    setFilteredMenu(
      menu.filter(
        (item) =>
          item.name?.toLowerCase().includes(keyword) ||
          item.category?.toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword)
      )
    );
  }, [search, menu]);

  // ==============================
  // APPLY DISCOUNT SETTINGS
  // ==============================
  const applyDiscount = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL2}/orders/${orderId}/discount`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          pax,
          discountedPax,
          discount,
        }),
      }
    );

    const data = await res.json();
    setOrder(normalizeOrder(data));
    setShowDiscount(false);

  };

  // ==============================
  // ADD ITEM
  // ==============================
  const handleAddProduct = async (product) => {
    if (order.status === "billed") return;

    const res = await fetch(
      `${process.env.REACT_APP_API_URL2}/orders/${orderId}/add`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          productName: product.name,
          quantity: 1,
          price: product.price,
        }),
      }
    );

    const data = await res.json();
    setOrder(normalizeOrder(data));
  };

  // ==============================
  // UPDATE QTY
  // ==============================
  const updateQuantity = async (productName, quantity) => {
    if (order.status === "billed") return;

    const res = await fetch(
      `${process.env.REACT_APP_API_URL2}/orders/${orderId}/item`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ productName, quantity }),
      }
    );

    const data = await res.json();
    setOrder(normalizeOrder(data));
  };

  const printReceipt = (orderData) => {
    const formatMoney = (num) => Number(num || 0).toFixed(2);

    const itemsHTML = (orderData.ordered || [])
      .map((item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);

        return `
          <div class="item">
            <div><b>${item.productName}</b></div>
            <div>${qty} x ${formatMoney(price)} = ₱${formatMoney(qty * price)}</div>
          </div>
        `;
      })
      .join("");

    const html = `
    <html>
    <head>
      <title>Receipt</title>

      <style>
        @page {
          size: A4;
          margin: 10mm;
        }

        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          font-family: monospace;
          font-size: 22px;   /* BIGGER TEXT */
          text-align: center;
        }

        .receipt {
          width: 100%;
          padding: 30px;
          box-sizing: border-box;
        }

        .line {
          border-top: 2px dashed black;
          margin: 20px 0;
        }

        .item {
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .title {
          font-size: 30px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .subtitle {
          font-size: 20px;
          margin-bottom: 10px;
        }

        .bold {
          font-weight: bold;
          font-size: 24px;
        }

        @media print {
          body {
            margin: 0;
          }
        }
      </style>
    </head>

    <body>
      <div class="receipt">

        <div class="title">
          NAPS RESTAURANT MAMBURAO
        </div>

        <div class="subtitle">
          CEL NO: 0945 377 8649
        </div>

        <div class="line"></div>

        <div>Ref Id: ${orderData._id}</div>
        <div>Order: ${orderData.orderName}</div>
        <div>Cashier: ${orderData.staffName}</div>

        <div>
          Date:
          ${new Date(orderData.createdAt).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>

        <div class="line"></div>

        ${itemsHTML}

        <div class="line"></div>

        <div>Subtotal: ₱${formatMoney(orderData.subtotal)}</div>
        <div>Pax: ${orderData.pax}</div>
        <div>Discounted Pax: ${orderData.discountedPax}</div>

        <div>
          Discount:
          ₱${formatMoney(
            (orderData.subtotal / orderData.pax) *
            orderData.discountedPax *
            (orderData.discount / 100)
          )}
          (${orderData.discount}%)
        </div>

        <div class="bold">
          Grand Total: ₱${formatMoney(orderData.grandTotal)}
        </div>

        <div>Cash: ₱${formatMoney(orderData.cash)}</div>

        <div class="bold">
          Change: ₱${formatMoney(orderData.cash - orderData.grandTotal)}
        </div>

        <div class="line"></div>

        <div>
          Naps Sarap Kain po! <br/>
          Thank you!
        </div>

      </div>

      <script>
        window.onload = () => {
          window.print();
          window.onafterprint = () => window.close();
        };
      </script>
    </body>
    </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };
  // ==============================
  // BILL OUT
  // ==============================
  const handleBillOut = async () => {
    if (!window.confirm("Bill out this order?")) return;

    const res = await fetch(
      `${process.env.REACT_APP_API_URL2}/orders/${orderId}/bill`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          cash,
        }),
      }
    );

    const data = await res.json();
    const updated = normalizeOrder(data);

    setOrder(updated);

    // ✅ IMPORTANT: wait for UI state then print
    setTimeout(() => {
      printReceipt(updated, cash);
    }, 300);
  };

  
  const deleteOrder = async (id) => {
  if (!window.confirm("Delete this order?")) return;

  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL2}/orders/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Order deleted");
      navigate("/orders"); // go back to list
    } else {
      alert(data.message || "Delete failed");
    }
  } catch (err) {
    console.error(err);
  }
};

  if (loading) return <p>Loading order...</p>;

  return (
    <div className="container mt-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between">
        <h2>{order.orderName}</h2>

        <div className="d-flex gap-2 mb-3">
          <button className="btn btn-warning" onClick={handleBillOut}>
            Bill Out
          </button>
         {/* {order.status === "pending" && (
            <button
              className="btn btn-danger"
              onClick={() => deleteOrder(orderId)}
            >
              Delete
            </button>
          )}*/}

          {order.status !== "cancelled" && (
              <button
                className="btn btn-outline-danger"
                onClick={async () => {
                  if (!window.confirm("Cancel this order?")) return;

                  try {
                    const res = await fetch(
                      `${process.env.REACT_APP_API_URL2}/orders/${orderId}/cancel`,
                      {
                        method: "PUT",
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                      }
                    );

                    const data = await res.json();

                    if (res.ok) {
                      setOrder(normalizeOrder(data.order));
                      alert("Order cancelled");
                    } else {
                      alert(data.message || "Cancel failed");
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                Cancel Order
              </button>
            )}

          <button className="btn btn-danger" onClick={() => navigate("/orders")}>
            x
          </button>
        </div>
      </div>

      <p>Cashier: {order.staffName}</p>
      <p> Date: {new Date(order.createdAt).toLocaleString()}</p>
      <p >Status: <span
                      className={
                        order.status === "billed"
                          ? "text-success"
                          : order.status === "cancelled"
                          ? "text-danger"
                          : "text-warning"
                      }
                    >
                      {order.status}
                    </span>
                       </p>

      <hr />

      {/* BILLING */}
      <h5>Billing</h5>

      <p>Subtotal: ₱{order.subtotal}</p>

      {/* BETWEEN SUBTOTAL AND GRAND TOTAL */}
      <button
        className="btn btn-outline-light mb-2"
        onClick={() => setShowDiscount(!showDiscount)}
      >
        {showDiscount ? "Hide Discount" : "Show Discount"}
      </button>

      {showDiscount && (
        <div className="card p-3 mb-3">

          <h6 className="mb-3">Discount</h6>

          {/* PAX */}
          <div className="row mb-2 align-items-center">
            <div className="col-4">
              <label>PAX</label>
            </div>
            <div className="col-8">
              <input
                className="form-control"
                type="number"
                min="1"
                value={pax}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setPax(value);

                  // auto-adjust discountedPax if it exceeds pax
                  if (discountedPax > value) {
                    setDiscountedPax(value);
                  }
                }}
              />
            </div>
          </div>

          {/* Discounted PAX */}
          <div className="row mb-2 align-items-center">
            <div className="col-4">
              <label>Discounted PAX</label>
            </div>
            <div className="col-8">
              <input
                className="form-control"
                type="number"
                min="0"
                max={pax}
                value={discountedPax}
                onChange={(e) => {
                  const value = Number(e.target.value);

                  if (value > pax) {
                    setDiscountedPax(pax);
                  } else {
                    setDiscountedPax(value);
                  }
                }}
              />
            </div>
          </div>

          {/* Discount % */}
          <div className="row mb-3 align-items-center">
            <div className="col-4">
              <label>Discount %</label>
            </div>
            <div className="col-8">
              <input
                className="form-control"
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>
          </div>

          {/* APPLY BUTTON */}
          <button
            className="btn btn-primary w-100"
            onClick={applyDiscount}
            // disabled={order.status === "billed"}
          >
            Apply
          </button>

        </div>
      )}

      <p>Discount: {order.discount}% = P{order.subtotal / pax * discountedPax * (order.discount /100)}</p>
      <h5>Grand Total: ₱{order.grandTotal}</h5>

      <div className="card p-3 mb-3">

        <h6 className="mb-3">Payment</h6>

        <div className="row mb-2 align-items-center">
          <div className="col-4">
            <label>Cash</label>
          </div>

          <div className="col-8">
            <input
              className="form-control"
              type="number"
              min="0"
              value={cash}
              onChange={(e) => setCash(Number(e.target.value))}
            />
          </div>
        </div>

        <h5>
          Change: ₱{change > 0 ? change.toFixed(2) : "0.00"}
        </h5>

      </div>

      <hr />

      {/* ITEMS */}
      <h4>Items</h4>

      <button className="btn btn-success mb-3" onClick={() => setShowModal(true)}>
        Add Items
      </button>

      <ul className="list-group">
        {order.ordered.map((item, i) => (
          <li key={i} className="list-group-item d-flex justify-content-between">

            <div>
              <b>{item.productName}</b><br />
              ₱{item.price} x {item.quantity}
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-danger btn-sm"
                onClick={() =>
                  updateQuantity(item.productName, item.quantity - 1)
                }
              >
                -
              </button>

              <span>{item.quantity}</span>

              <button
                className="btn btn-success btn-sm"
                onClick={() =>
                  updateQuantity(item.productName, item.quantity + 1)
                }
              >
                +
              </button>
            </div>

          </li>
        ))}
      </ul>

      {/* MODAL */}
      {showModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">

              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Add Items</h5>

                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm bg-danger"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">

                <input
                  className="form-control mb-3"
                  placeholder="Search menu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <table className="table">
                  <tbody>
                    {filteredMenu.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>₱{p.price}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAddProduct(p)}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersView;