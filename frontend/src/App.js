import React, { useEffect, useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import { fetchCustomers } from './api/api';
import CustomerForm from './components/CustomerForm';
import BulkUpload from './components/BulkUpload';
import CustomerTable from './components/CustomerTable';
import './styles/custom.css';

function App() {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetchCustomers(page, limit);
      setCustomers(res.data.customers);
      setTotal(res.data.total);
    } catch {
      alert('Failed to load customers');
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const openAddForm = () => {
    setEditCustomer(null);
    setShowForm(true);
  };

  const openEditForm = (customer) => {
    setEditCustomer(customer);
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const totalPages = Math.ceil(total / limit);

  return (
    <Container className="py-4">
      <h1>Customer Management System</h1>
      <Button onClick={openAddForm} className="mb-3">Add Customer</Button>

      <BulkUpload refreshList={fetchData} />

      <CustomerTable
        customers={customers}
        onEdit={openEditForm}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />

      <CustomerForm
        show={showForm}
        handleClose={closeForm}
        customer={editCustomer}
        refreshList={fetchData}
      />
    </Container>
  );
}

export default App;
