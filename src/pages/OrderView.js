import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const OrdersView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState({
    ordered: [],
    total: 0,
    status: "pending",
  });

  const [menu, setMenu] = useState([]);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  // ==============================
  // NORMALIZER
  // ==============================
  const normalizeOrder = (data) => ({
    ...data,
    ordered: Array.isArray(data?.ordered) ? data.ordered : [],
    total: Number(data?.total || 0),
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
      setOrder(normalizeOrder(data));
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
    const res = await import("../menuData");
    setMenu(res.default);
    setFilteredMenu(res.default);
  };

  useEffect(() => {
    fetchOrder();
    loadMenu();
  }, [orderId]);

  // ==============================
  // SEARCH
  // ==============================
  useEffect(() => {
    const keyword = search.toLowerCase();

    setFilteredMenu(
      menu.filter((item) =>
        item.name?.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword)
      )
    );
  }, [search, menu]);

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
  // UPDATE QTY (0 = REMOVE)
  // ==============================
  const updateQuantity = async (productName, newQty) => {
    if (order.status === "billed") return;

    const res = await fetch(
      `${process.env.REACT_APP_API_URL2}/orders/${orderId}/item`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          productName,
          quantity: newQty,
        }),
      }
    );

    const data = await res.json();
    setOrder(normalizeOrder(data));
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();
    const updatedOrder = normalizeOrder(data);

    setOrder(updatedOrder);

    // 🧾 trigger receipt print AFTER update
    printReceipt(updatedOrder);
  };

  const printReceipt = (orderData) => {
    const formatMoney = (num) =>
      Number(num || 0).toFixed(2);

    const itemsHTML = (orderData.ordered || [])
      .map((item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const subtotal = qty * price;

        return `
          <div class="item">
            <div class="name">${item.productName}</div>

            <div class="line">
              <span>${qty} x ${formatMoney(price)}</span>
              <span>${formatMoney(subtotal)}</span>
            </div>
          </div>
        `;
      })
      .join("");

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>Receipt</title>

          <style>
            body {
              font-family: monospace;
              width: 280px;
              margin: 0 auto;
              padding: 0px;
              font-size: 12px;
              color: #000;
            }

            .center {
              text-align: center;
            }

            .bold {
              font-weight: bold;
            }

            .divider {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }

            .item {
              margin-bottom: 8px;
            }

            .name {
              font-weight: bold;
              word-wrap: break-word;
            }

            .line {
              display: flex;
              justify-content: space-between;
            }

            .total {
              font-size: 14px;
              font-weight: bold;
            }

            .footer {
              text-align: center;
              margin-top: 12px;
            }

            @media print {
              body {
                width: 100%;
                margin: 0;
              }
            }
          </style>
        </head>

        <body>

          <div class="center bold">
            NAPS RESTAURANT MAMBURAO
          </div>

          <div class="center">
            TIN: 149-826-116-00000
          </div>

          <div class="center">
            CEL NO: 0945 377 8649
          </div>

          <div class="divider"></div>

          <div>Order: ${orderData.orderName}</div>
          <div>Cashier: ${orderData.staffName}</div>
          <div>
            Date:
            ${new Date(orderData.createdAt).toLocaleString()}
          </div>

          <div class="divider"></div>

          ${itemsHTML}

          <div class="divider"></div>

          <div class="line total">
            <span>TOTAL</span>
            <span>₱${formatMoney(orderData.total)}</span>
          </div>

          <div class="divider"></div>

          <div class="footer">
            Thank you!<br />
            Please come again
          </div>

        </body>
      </html>
    `;

    // ✅ CREATE HIDDEN IFRAME
    const iframe = document.createElement("iframe");

    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";

    document.body.appendChild(iframe);

    const iframeDoc =
      iframe.contentWindow || iframe.contentDocument;

    iframeDoc.document.open();
    iframeDoc.document.write(receiptHTML);
    iframeDoc.document.close();

    // ✅ MOBILE SAFE PRINT
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // cleanup
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

    }, 500);
  };

  // ==============================
  // DELETE ORDER
  // ==============================
  const handleRemoveOrder = async () => {
    if (!window.confirm("Delete this order?")) return;

    await fetch(`${process.env.REACT_APP_API_URL2}/orders/${orderId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    navigate("/orders");
  };

  if (loading) return <p>Loading order...</p>;

  const orderedItems = order?.ordered || [];

  return (
    <div className="container mt-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center">
        <h2>{order.orderName}</h2>

        <div className="d-flex gap-2">

          
            <button className="btn btn-warning" onClick={handleBillOut}>
              Bill Out
            </button>
        

          <button className="btn btn-danger" onClick={handleRemoveOrder}>
            Remove
          </button>

        </div>
      </div>
      <p>
        <strong>Date:</strong>{" "}
        {order.createdAt
          ? new Date(order.createdAt).toLocaleString()
          : "N/A"}
      </p>
      <p><strong>Staff:</strong> {order.staffName}</p>
      <p><strong>Service:</strong> {order.serviceType}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <p><strong>Total:</strong> ₱{order.total}</p>

      <hr />

      {/* ITEMS */}
      <h4>Ordered Items</h4>

      <button
        className="btn btn-success mb-3"
        disabled={order.status === "billed"}
        onClick={() => setShowModal(true)}
      >
        Add Items
      </button>

      <ul className="list-group mb-4">
        {orderedItems.map((item, index) => {
          const price = Number(item.price || 0);
          const qty = Number(item.quantity || 0);
          const subtotal = price * qty;

          return (
            <li
              key={index}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {/* ITEM INFO */}
              <div>
                <div><strong>{item.productName}</strong></div>
                <small className="text-muted">
                  ₱{price.toFixed(2)} × {qty} = ₱{subtotal.toFixed(2)}
                </small>
              </div>

              {/* CONTROLS */}
              <div className="d-flex gap-2 align-items-center">

                <button
                  className="btn btn-sm btn-outline-danger"
                  disabled={order.status === "billed"}
                  onClick={() =>
                    updateQuantity(item.productName, item.quantity - 1)
                  }
                >
                  -
                </button>

                <span>{qty}</span>

                <button
                  className="btn btn-sm btn-outline-success"
                  disabled={order.status === "billed"}
                  onClick={() =>
                    updateQuantity(item.productName, item.quantity + 1)
                  }
                >
                  +
                </button>

              </div>
            </li>
          );
        })}
      </ul>

      {/* MODAL */}
      {showModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">

              <div className="modal-header">
                <h5>Select Items</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <div className="modal-body">

                <input
                  className="form-control mb-3"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMenu.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>₱{product.price}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAddProduct(product)}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersView;