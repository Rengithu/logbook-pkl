const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/contacts.json');

function getContacts() {
  if (!fs.existsSync(dataPath)) return [];
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function saveContacts(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  res.json(getContacts());
});

router.post('/', (req, res) => {
  const contacts = getContacts();
  const newContact = { id: Date.now().toString(), ...req.body };
  contacts.push(newContact);
  saveContacts(contacts);
  res.status(201).json(newContact);
});

router.delete('/:id', (req, res) => {
  let contacts = getContacts();
  contacts = contacts.filter(c => c.id !== req.params.id);
  saveContacts(contacts);
  res.json({ message: 'Deleted' });
});

module.exports = router;
