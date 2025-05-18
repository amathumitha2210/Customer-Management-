const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  addressLine1: String,
  addressLine2: String,
  city: String,
  country: String
});

const FamilyMemberSchema = new mongoose.Schema({
  name: String,
  nic: String
}, { _id: false });

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  nic: { type: String, required: true, unique: true },
  mobiles: [String],
  addresses: [AddressSchema],
  familyMembers: [FamilyMemberSchema]  // now embedded subdocuments
});

module.exports = mongoose.model('Customer', CustomerSchema);
