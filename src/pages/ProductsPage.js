import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import menu from "../menuData"; // adjust path if needed

const ProductsPage = () => {
  // Get unique categories
  const categories = [...new Set(menu.map(item => item.category))];

  return (
    <Container className="mt-4">
      {categories.map((category, index) => (
        <div key={index} className="mb-5">
          <h3 className="mb-3">{category}</h3>

          <Row>
            {menu
              .filter(item => item.category === category)
              .map(product => (
                <Col md={3} sm={6} xs={12} key={product.id} className="mb-4">
                  <Card className="h-100 shadow-sm">
                    
                    {/* Image */}
                    <Card.Img
                      variant="top"
                      src={product.image || "/images/noimage.png"}
                      style={{
                        height: "300px",
                        objectFit: "cover"
                      }}
                    />

                    <Card.Body className="d-flex flex-column">
                      <Card.Title>{product.name}</Card.Title>

                      {/* Description (supports HTML like <br/>) */}
                      <Card.Text
                        dangerouslySetInnerHTML={{
                          __html: product.description || ""
                        }}
                        style={{ fontSize: "0.9rem", minHeight: "40px" }}
                      />

                      <h5 className="mt-auto">₱{product.price}</h5>

                      <Button variant="primary" className="mt-2">
                        Add to Cart
                      </Button>
                    </Card.Body>

                  </Card>
                </Col>
              ))}
          </Row>
        </div>
      ))}
    </Container>
  );
};

export default ProductsPage;