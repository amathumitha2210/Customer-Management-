import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col } from 'react-bootstrap';

function CustomerTable({ customers, onEdit, page, totalPages, setPage }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState(customers);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = customers.filter((cust) => {
      const nameMatch = cust.name?.toLowerCase().includes(lowerCaseSearchTerm);
      const nicMatch = cust.nic?.toLowerCase().includes(lowerCaseSearchTerm);
      const cityMatch = cust.addresses?.some((addr) =>
        addr.city?.toLowerCase().includes(lowerCaseSearchTerm)
      );
      return nameMatch || nicMatch || cityMatch;
    });
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  return (
    <>
      <Form className="mb-3">
        <Row>
          <Col md={4}>
            <Form.Control
              type="text"
              placeholder="Search by name, NIC, or city"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Col>
        </Row>
      </Form>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>DOB</th>
            <th>NIC</th>
            <th>Mobiles</th>
            <th>Address Line 1/2</th>
            <th>Family Members</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center">
                No customers found.
              </td>
            </tr>
          ) : (
            filteredCustomers.map((cust) => {
              const primaryAddress = cust.addresses?.[0] || {};
              return (
                <tr key={cust._id}>
                  <td>{cust.name}</td>
                  <td>
                    {cust.dob
                      ? new Date(cust.dob).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>{cust.nic}</td>
                  <td>
                    {Array.isArray(cust.mobiles)
                      ? cust.mobiles.join(', ')
                      : '-'}
                  </td>
                  <td>
                    {primaryAddress.addressLine1}
                    <br />
                    {primaryAddress.addressLine2}
                  </td>
                  <td>
                    {Array.isArray(cust.familyMembers) &&
                    cust.familyMembers.length > 0 ? (
                      <ul className="mb-0 ps-3">
                        {cust.familyMembers.map((fm) => (
                          <li key={fm._id}>
                            {fm.name} ({fm.nic})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onEdit(cust)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <div className="d-flex justify-content-between align-items-center">
        <Button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          variant="secondary"
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          variant="secondary"
        >
          Next
        </Button>
      </div>
    </>
  );
}

export default CustomerTable;
