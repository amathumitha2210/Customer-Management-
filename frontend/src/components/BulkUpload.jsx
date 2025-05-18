import React, { useState } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { bulkUploadCustomers } from '../api/api';

function BulkUpload({ refreshList }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = e => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel file');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      setError('');
      setMessage('Uploading...');
      const res = await bulkUploadCustomers(formData);
      setMessage(res.data.message);
      refreshList();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    }
  };

  return (
    <div className="my-3">
      <h5>Bulk Upload Customers (Excel)</h5>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
      <Button className="ms-2" onClick={handleUpload}>Upload</Button>
      <p className="mt-2 text-muted">
        Excel columns must include: Name, DOB (yyyy-mm-dd), NIC, Mobiles (comma separated), AddressLine1, AddressLine2, City, Country
      </p>
    </div>
  );
}

export default BulkUpload;
