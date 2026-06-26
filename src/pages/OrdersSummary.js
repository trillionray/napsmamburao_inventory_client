import {
  useEffect,
  useState,
  useContext,
  useMemo,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import UserContext from "../context/UserContext";

const OrdersSummary = () => {
  const { user } =
    useContext(UserContext);

  const navigate =
    useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("all");

  const today =
    new Date();

  const [
    startDate,
    setStartDate,
  ] = useState(
    today
      .toISOString()
      .split("T")[0]
  );

  const [
    endDate,
    setEndDate,
  ] = useState(
    today
      .toISOString()
      .split("T")[0]
  );

  const [
    startTime,
    setStartTime,
  ] = useState("00:00");

  const [
    endTime,
    setEndTime,
  ] = useState("23:59");

  // ======================
  // FETCH
  // ======================
  const fetchOrders =
    async () => {
      try {
        setLoading(true);

        const res =
          await fetch(
            `${process.env.REACT_APP_API_URL2}/orders`,
            {
              headers: {
                Authorization:
                  `Bearer ${localStorage.getItem(
                    "token"
                  )}`,
              },
            }
          );

        const data =
          await res.json();

        setOrders(
          Array.isArray(
            data
          )
            ? data
            : data.orders ||
                []
        );
      } catch (err) {
        console.error(
          err
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
  fetchOrders();

  const interval = setInterval(() => {
  fetchOrders();
  }, 30000); // 60 seconds

  return () => clearInterval(interval);
  }, []);


  // ======================
  // OPEN ORDER
  // ======================
  const handleSelectOrder =
    (
      orderId
    ) => {
      navigate(
        `/orders/${orderId}`
      );
    };

  // ======================
  // FILTER
  // ======================
  const filteredOrders =
    useMemo(() => {
      const start =
        new Date(
          `${startDate}T${startTime}`
        );

      const end =
        new Date(
          `${endDate}T${endTime}`
        );

      return orders.filter(
        (
          o
        ) => {
          const created =
            new Date(
              o.createdAt
            );

          const dateMatch =
            created >=
              start &&
            created <=
              end;

          const statusMatch =
            selectedStatus ===
              "all" ||
            o.status ===
              selectedStatus;

          return (
            dateMatch &&
            statusMatch
          );
        }
      );
    }, [
      orders,
      startDate,
      endDate,
      startTime,
      endTime,
      selectedStatus,
    ]);

  // ======================
  // STATUS
  // ======================
  const statusSummary =
    useMemo(() => {
      const map =
        {};

      orders.forEach(
        (
          o
        ) => {
          const created =
            new Date(
              o.createdAt
            );

          const start =
            new Date(
              `${startDate}T${startTime}`
            );

          const end =
            new Date(
              `${endDate}T${endTime}`
            );

          if (
            created >=
              start &&
            created <=
              end
          ) {
            const status =
              o.status ||
              "unknown";

            map[
              status
            ] =
              (
                map[
                  status
                ] ||
                0
              ) +
              1;
          }
        }
      );

      return map;
    }, [
      orders,
      startDate,
      endDate,
      startTime,
      endTime,
    ]);

  // ======================
  // BILLED ONLY
  // ======================
  const billedOrders =
    useMemo(
      () =>
        filteredOrders.filter(
          (
            o
          ) =>
            o.status ===
            "billed"
        ),
      [
        filteredOrders,
      ]
    );

  // ======================
  // SUMMARY
  // ======================
  const summary =
    useMemo(() => {
      const total =
        billedOrders.reduce(
          (
            sum,
            o
          ) =>
            sum +
            Number(
              o.grandTotal ||
                0
            ),
          0
        );

      const avgGrand =
        billedOrders.length
          ? total /
            billedOrders.length
          : 0;

      const days =
        new Set(
          billedOrders.map((o) => {
            const d = new Date(o.createdAt);

            return `${d.getFullYear()}-${
              String(d.getMonth() + 1).padStart(2, "0")
            }-${
              String(d.getDate()).padStart(2, "0")
            }`;
          })
        ).size;

      const avgPerDay =
        days
          ? total /
            days
          : 0;

      return {
        total,
        avgGrand,
        avgPerDay,
        days,
        orders:
          billedOrders.length,
      };
    }, [
      billedOrders,
    ]);

  if (
    !user
  )
    return (
      <p>
        Loading...
      </p>
    );

  return (
    <div className="container mt-3 px-2">

      <h4>
        Orders Summary
      </h4>

      <p className="small">
        Staff:
        {" "}
        {
          user.name
        }
      </p>

      {/* FILTER */}

      <div className="card p-3 mb-3">

        <div className="row g-2">

          {[
            [
              "Start Date",
              startDate,
              setStartDate,
              "date",
            ],

            [
              "Start Time",
              startTime,
              setStartTime,
              "time",
            ],

            [
              "End Date",
              endDate,
              setEndDate,
              "date",
            ],

            [
              "End Time",
              endTime,
              setEndTime,
              "time",
            ],
          ].map(
            (
              [
                label,
                value,
                setter,
                type,
              ]
            ) => (
              <div
                className="col-6 col-md-3"
                key={
                  label
                }
              >
                <label className="small">
                  {
                    label
                  }
                </label>

                <input
                  type={
                    type
                  }
                  className="form-control form-control-sm"
                  value={
                    value
                  }
                  onChange={(
                    e
                  ) =>
                    setter(
                      e
                        .target
                        .value
                    )
                  }
                />
              </div>
            )
          )}

        </div>

      </div>

      {loading ? (
        <p className="text-center">
          Loading...
        </p>
      ) : (
        <>
          {/* SUMMARY */}

          <div className="row g-2 mb-3">

            {[
              [
                "Total (Billed)",
                `₱${summary.total.toLocaleString()}`,
              ],

              [
                "Average Check",
                `₱${summary.avgGrand.toFixed(
                  2
                )}`,
              ],

              [
                "ADS",
                `₱${summary.avgPerDay.toFixed(
                  2
                )}`,
              ],

              [
                "TC / Days",
                `${summary.orders} / ${summary.days}`,
              ],
            ].map(
              (
                [
                  title,
                  value,
                ]
              ) => (
                <div
                  className="col-6 col-md-3"
                  key={
                    title
                  }
                >
                  <div className="card p-3 text-center">
                    <div className="small">
                      {
                        title
                      }
                    </div>

                    <div className="fw-bold">
                      {
                        value
                      }
                    </div>
                  </div>
                </div>
              )
            )}

          </div>

          {/* STATUS */}

          <div className="card p-3 mb-3">

            <div className="small mb-2">
              Status Breakdown
            </div>

            <div className="d-flex flex-wrap gap-2">

              <span
                className={`badge ${
                  selectedStatus ===
                  "all"
                    ? "bg-primary"
                    : "bg-dark"
                }`}
                style={{
                  cursor:
                    "pointer",
                }}
                onClick={() =>
                  setSelectedStatus(
                    "all"
                  )
                }
              >
                All
              </span>

              {Object.entries(
                statusSummary
              ).map(
                (
                  [
                    status,
                    count,
                  ]
                ) => (
                  <span
                    key={
                      status
                    }
                    className={`badge ${
                      selectedStatus ===
                      status
                        ? "bg-primary"
                        : "bg-dark"
                    }`}
                    style={{
                      cursor:
                        "pointer",
                    }}
                    onClick={() =>
                      setSelectedStatus(
                        status
                      )
                    }
                  >
                    {
                      status
                    }
                    :
                    {" "}
                    {
                      count
                    }
                  </span>
                )
              )}

            </div>

          </div>

          {/* ORDERS */}

          <div className="row g-2">

            {filteredOrders.length ===
            0 ? (
              <p className="text-center">
                No orders found
              </p>
            ) : (
              filteredOrders.map(
                (
                  order
                ) => (
                  <div
                    className="col-6 col-md-4 col-lg-3"
                    key={
                      order._id
                    }
                  >
                    <div
                      className="card p-3 h-100"
                      onClick={() =>
                        handleSelectOrder(
                          order._id
                        )
                      }
                      style={{
                        cursor:
                          "pointer",

                        border:
                          "4px solid white",

                        borderRadius:
                          "14px",

                        boxShadow:
                          "0 0 0 2px rgba(255,255,255,.9), 0 4px 12px rgba(0,0,0,.12)",

                        transition:
                          ".15s",
                      }}
                    >

                      <h6>
                        {
                          order.orderName
                        }
                      </h6>

                      <div className="small">
                        Staff:
                        {" "}
                        {
                          order.staffName
                        }
                      </div>

                      <div className="small">
                        Type:
                        {" "}
                        {
                          order.serviceType
                        }
                      </div>

                      <div className="small">
                        Pax:
                        {" "}
                        {
                          order.pax
                        }
                      </div>

                      <hr />

                      <div className="fw-bold">
                        ₱
                        {
                          order.grandTotal
                        }
                      </div>

                      <div className="small">
                        <span
                          className={
                            order.status ===
                            "billed"
                              ? "text-success"
                              : order.status ===
                                "cancelled"
                              ? "text-danger"
                              : "text-warning"
                          }
                        >
                          {
                            order.status
                          }
                        </span>
                      </div>

                      <small>
                        {new Date(
                          order.createdAt
                        ).toLocaleString()}
                      </small>

                    </div>
                  </div>
                )
              )
            )}

          </div>

        </>
      )}

    </div>
  );
};

export default OrdersSummary;