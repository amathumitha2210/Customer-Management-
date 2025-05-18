import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { addCustomer, updateCustomer } from '../api/api';
import axios from 'axios';

function CustomerForm({ show, handleClose, customer, refreshList }) {
  const [form, setForm] = useState({
    name: '',
    dob: '',
    nic: '',
    mobiles: [''],
    addresses: [{ addressLine1: '', addressLine2: '', city: '', country: '' }],
    familyMembers: [],
  });

  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState({}); // keyed by country name

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (customer) {
      const formattedForm = {
        name: customer.name || '',
        dob: customer.dob ? new Date(customer.dob).toISOString().split('T')[0] : '',
        nic: customer.nic || '',
        mobiles: customer.mobiles.length ? customer.mobiles : [''],
        addresses: customer.addresses.length
          ? customer.addresses.map(addr => ({
              addressLine1: addr.addressLine1 || '',
              addressLine2: addr.addressLine2 || '',
              city: addr.city || '',
              country: addr.country || '',
            }))
          : [{ addressLine1: '', addressLine2: '', city: '', country: '' }],
        familyMembers: customer.familyMembers || [],
      };

      setForm(formattedForm);

      // Prefetch cities for each address
      formattedForm.addresses.forEach(addr => {
        if (addr.country) {
          fetchCitiesByCountry(addr.country);
        }
      });
    } else {
      setForm({
        name: '',
        dob: '',
        nic: '',
        
        mobiles: [''],
        addresses: [{ addressLine1: '', addressLine2: '', city: '', country: '' }],
        familyMembers: [],
      });
    }
  }, [customer]);

  const fetchCountries = async () => {
    try {
      const res = await axios.get('https://restcountries.com/v3.1/all');
      const countryData = res.data
        .map(c => c.name.common)
        .sort((a, b) => a.localeCompare(b));
      setCountries(countryData);
    } catch (err) {
      console.error('Failed to fetch countries:', err);
    }
  };

  const fetchCitiesByCountry = async (countryName) => {
    if (!countryName || cities[countryName]) return;
    try {
      const res = await axios.post('https://countriesnow.space/api/v0.1/countries/cities', {
        country: countryName,
      });
      if (res.data && res.data.data) {
        setCities(prev => ({ ...prev, [countryName]: res.data.data.sort() }));
      }
    } catch (err) {
      console.error(`Failed to fetch cities for ${countryName}:`, err);
    }
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleMobileChange = (idx, value) => {
    const newMobiles = [...form.mobiles];
    newMobiles[idx] = value;
    setForm(prev => ({ ...prev, mobiles: newMobiles }));
  };
  const addMobile = () => setForm(prev => ({ ...prev, mobiles: [...prev.mobiles, ''] }));
  const removeMobile = (idx) => {
    if (form.mobiles.length === 1) return;
    setForm(prev => ({ ...prev, mobiles: prev.mobiles.filter((_, i) => i !== idx) }));
  };

  const handleAddressChange = (idx, field, value) => {
    const newAddresses = [...form.addresses];
    newAddresses[idx][field] = value;
    setForm(prev => ({ ...prev, addresses: newAddresses }));
  };
  const addAddress = () =>
    setForm(prev => ({
      ...prev,
      addresses: [...prev.addresses, { addressLine1: '', addressLine2: '', city: '', country: '' }],
    }));
  const removeAddress = (idx) => {
    if (form.addresses.length === 1) return;
    setForm(prev => ({ ...prev, addresses: prev.addresses.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Name is required');
    if (!form.dob.trim()) return alert('DOB is required');
    if (!form.nic.trim()) return alert('NIC is required');

    const customerData = {
      name: form.name,
      dob: form.dob,
      nic: form.nic,
      mobiles: form.mobiles.filter(m => m.trim()),
      addresses: form.addresses.map(addr => ({
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city || null,
        country: addr.country || null,
      })),
      familyMembers: form.familyMembers,
    };

    try {
      if (customer) {
        await updateCustomer(customer._id, customerData);
      } else {
        await addCustomer(customerData);
      }
      refreshList();
      handleClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save customer');
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{customer ? 'Edit Customer' : 'Add Customer'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Date of Birth *</Form.Label>
            <Form.Control
              type="date"
              value={form.dob}
              onChange={e => handleChange('dob', e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>NIC *</Form.Label>
            <Form.Control
              type="text"
              value={form.nic}
              onChange={e => handleChange('nic', e.target.value)}
            />
          </Form.Group>

          <Form.Label>Mobile Numbers</Form.Label>
          {form.mobiles.map((mobile, idx) => (
            <Row key={idx} className="mb-2">
              <Col xs={10}>
                <Form.Control
                  type="text"
                  value={mobile}
                  onChange={e => handleMobileChange(idx, e.target.value)}
                />
              </Col>
              <Col xs={2}>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeMobile(idx)}
                  disabled={form.mobiles.length === 1}
                >
                  Remove
                </Button>
              </Col>
            </Row>
          ))}
          <Button variant="secondary" size="sm" onClick={addMobile} className="mb-3">
            Add Mobile
          </Button>

          <hr />

          <Form.Label>Addresses</Form.Label>
          {form.addresses.map((addr, idx) => (
            <div key={idx} className="address-block p-3 mb-3 border rounded">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Address Line 1</Form.Label>
                    <Form.Control
                      type="text"
                      value={addr.addressLine1}
                      onChange={e => handleAddressChange(idx, 'addressLine1', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Address Line 2</Form.Label>
                    <Form.Control
                      type="text"
                      value={addr.addressLine2}
                      onChange={e => handleAddressChange(idx, 'addressLine2', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Country</Form.Label>
                    <Form.Select
                      value={addr.country}
                      onChange={e => {
                        const selected = e.target.value;
                        handleAddressChange(idx, 'country', selected);
                        fetchCitiesByCountry(selected);
                        handleAddressChange(idx, 'city', '');
                      }}
                    >
                      <option value="">Select Country</option>
                      {countries.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>City</Form.Label>
                    <Form.Select
                      value={addr.city}
                      onChange={e => handleAddressChange(idx, 'city', e.target.value)}
                    >
                      <option value="">Select City</option>
                      {(cities[addr.country] || []).map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Button
                variant="danger"
                size="sm"
                onClick={() => removeAddress(idx)}
                disabled={form.addresses.length === 1}
              >
                Remove Address
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addAddress}>
            Add Address
          </Button>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          {customer ? 'Update' : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CustomerForm;
