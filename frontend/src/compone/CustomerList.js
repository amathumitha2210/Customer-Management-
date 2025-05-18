import React, { useState, useEffect } from 'react';
import CustomerTable from './CustomerTable';
import { Form } from 'react-bootstrap';

function CustomerList({ allCustomers }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState(allCustomers);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const result = allCustomers.filter(cust =>
      cust.name.toLowerCase().includes(term) ||
      cust.nic.toLowerCase().includes(term) ||
      (cust.mobiles?.join(',') || '').toLowerCase().includes(term)
    );
    setFilteredCustomers(result);
    setPage(1);
  }, [searchTerm, allCustomers]);

  const totalPages = Math.ceil(filteredCustomers.length / perPage);
  const currentPageCustomers = filteredCustomers.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <Form.Control
        type="text"
        placeholder="Search by Name, NIC, or Mobile"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="mb-3"
      />

      <CustomerTable
        customers={currentPageCustomers}
        onEdit={(cust) => console.log('Edit:', cust)}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </>
  );
}

export default CustomerList;
