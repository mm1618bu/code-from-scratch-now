import express from 'express';
import { connectToDatabase } from '../lib/mongodb';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Connect to the database
    const { db } = await connectToDatabase('your_database_name');
    const collection = db.collection('wiserUsers');

    // Find the user by email
    const user = await collection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Authentication successful
    res.status(200).json({ message: 'Login successful', user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;