const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const dbPath = path.join(__dirname, '..', '..', 'data', 'db.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

db.defaults({
  profile: {
    namaPeserta: '',
    tempatPkl: '',
    namaInstruktur: '',
    namaPembimbing: '',
    geminiApiKey: ''
  },
  entries: [] // { id, tanggal, hari, kegiatan, photos: [filename,...], createdAt }
}).write();

module.exports = db;
