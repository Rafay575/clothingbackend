// server.js
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // Replace with your MySQL username
  password: '',  // Replace with your MySQL password
  database: 'formdb',  // Replace with your database name
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.post('/submit-form', (req, res) => {
    const { name, email, address, city, state, postalCode, country, phone, totalAmount, products } = req.body;
    // console.log(name, email, address, city, state, postalCode, country, phone, totalAmount, products);
  
    const sql = `INSERT INTO form_data (name, email, address, city, state, postalCode, country, phone, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
    db.query(sql, [name, email, address, city, state, postalCode, country, phone, totalAmount], (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).json({ message: 'Error saving form data' });
        return;
      }
  
      const orderId = result.insertId;
  
      const sqlOrderItems = `INSERT INTO order_items (form_data_id, quantity, size, name, color, material) VALUES ?`;
  
      const orderItems = products.map(product => [
        orderId,
        product.quantity,
        product.size,
        product.name,
        product.color,
        product.material,
      ]);
  
      db.query(sqlOrderItems, [orderItems], (err, result) => {
        if (err) {
          console.error('Error inserting order items:', err);
          res.status(500).json({ message: 'Error saving order items' });
          return;
        }
  
        // Send the response after successfully inserting both form data and order items
        res.status(201).json({ message: 'Order data saved successfully',id:orderId});
      });
    });
  });
  // Route to fetch all orders
app.get('/orders', (req, res) => {
    const sql = `
    SELECT 
    fd.id, 
    fd.name, 
    fd.email, 
    fd.address, 
    fd.city, 
    fd.state, 
    fd.postalCode, 
    fd.country, 
    fd.phone, 
    fd.total, 
    oi.quantity, 
    oi.size, 
    oi.name as productName, 
    oi.color, 
    oi.material
FROM 
    form_data fd
LEFT JOIN 
    order_items oi 
ON 
    fd.id = oi.form_data_id
WHERE 
    fd.approve = 1
ORDER BY 
    fd.id DESC;
`;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Error fetching orders' });
        return;
      }
      
      const orders = results.reduce((acc, row) => {
        const { id, name, email, address, city, state, postalCode, country, phone, total } = row;
        const product = {
          quantity: row.quantity,
          size: row.size,
          name: row.productName,
          color: row.color,
          material: row.material,
        };
  
        if (!acc[id]) {
          acc[id] = { id, name, email, address, city, state, postalCode, country, phone, total, products: [] };
        }
  
        acc[id].products.push(product);
        return acc;
      }, {});
  
      res.status(200).json(Object.values(orders));
    });
  });
  
  app.put('/approve/:id', (req, res) => {
    const { id } = req.params;
  
    const sql = `UPDATE form_data SET approve = 1 WHERE id = ?`;
  
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Error updating approval:', err);
        res.status(500).json({ message: 'Error updating approval' });
        return;
      }
      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'No record found with this ID' });
      } else {
        res.status(200).json({ message: 'Approval updated successfully' });
      }
    });
  });
  
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
