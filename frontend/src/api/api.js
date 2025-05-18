import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// export const fetchCities = () => axios.get(`${API_URL}/cities`);
// export const fetchCountries = () => axios.get(`${API_URL}/countries`);

export const fetchCustomers = (page, limit) =>
  axios.get(`${API_URL}/customers?page=${page}&limit=${limit}`);

export const addCustomer = (customer) =>
  axios.post(`${API_URL}/customers`, customer);

export const updateCustomer = (id, customer) =>
  axios.put(`${API_URL}/customers/${id}`, customer);

export const bulkUploadCustomers = (formData) =>
  axios.post(`${API_URL}/customers/bulk-upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
