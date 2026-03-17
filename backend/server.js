const express = require('express');
const cors = require('cors');
// const bodyParser = require('body-parser'); // Remove body-parser
const admin = require('firebase-admin');
require('dotenv').config();

console.log('Environment variables loaded:');
console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD);

const app = express();
const PORT = process.env.PORT || 5000;

let db; // Declare db outside

// Firebase initialization
try {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  db = admin.firestore(); // Assign to global db
  console.log('Firebase initialized successfully');
  console.log('DB object:', typeof db);
} catch (error) {
  console.error('Firebase initialization error:', error);
  process.exit(1);
}

if (!db) {
  console.error('DB is not defined after Firebase init');
  process.exit(1);
}

app.use(cors());
app.use(express.json()); // Use express JSON parser only

// Error handling for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next();
});

// Test route
app.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Middleware to check admin auth
const checkAdminAuth = (req, res, next) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Routes

// Login for admin and sales
app.post('/login', async (req, res) => {
  const { username, password, type } = req.body; // type: 'admin' or 'sales'
  console.log('Login attempt:', { username, password, type });
  console.log('Env vars:', { ADMIN_USERNAME: process.env.ADMIN_USERNAME, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD });
  if (type === 'admin') {
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      // Log admin login
      await db.collection('activityLogs').add({
        user: 'Administrator',
        username: username,
        action: 'login',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, role: 'admin' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } else if (type === 'sales') {
    const salesUser = await db.collection('salesUsers').where('username', '==', username).where('password', '==', password).get();
    if (!salesUser.empty) {
      const user = salesUser.docs[0].data();
      // Log sales login with user name and username
      await db.collection('activityLogs').add({
        user: user.name || username,
        username: username,
        action: 'login',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ 
        success: true, 
        role: 'sales', 
        userId: salesUser.docs[0].id,
        name: user.name,
        username: username
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } else {
    res.status(400).json({ error: 'Invalid type' });
  }
});

// Logout endpoint
app.post('/logLogout', async (req, res) => {
  const { username, name } = req.body;
  try {
    // Log the logout event
    await db.collection('activityLogs').add({
      user: name || username,
      username: username,
      action: 'logout',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging logout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit visitor form
app.post('/submitVisitor', async (req, res) => {
  const visitorData = req.body;
  // Remove Govt ID fields if present
  delete visitorData.governmentIdType;
  delete visitorData.governmentIdNumber;
  visitorData.status = 'Pending';
  visitorData.submissionDate = admin.firestore.FieldValue.serverTimestamp();
  try {
    const docRef = await db.collection('visitors').add(visitorData);
    res.json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all visitors
app.get('/getVisitors', async (req, res) => {
  try {
    const visitors = await db.collection('visitors').get();
    const visitorList = visitors.docs.map(doc => {
      const data = doc.data();
      // Remove Govt ID fields from response
      delete data.governmentIdType;
      delete data.governmentIdNumber;
      return { id: doc.id, ...data };
    });
    res.json(visitorList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a visitor
app.post('/deleteVisitor', async (req, res) => {
  const { visitorId } = req.body;
  try {
    if (!visitorId) {
      return res.status(400).json({ error: 'Visitor ID is required' });
    }
    
    await db.collection('visitors').doc(visitorId).delete();
    
    // Log the activity
    await db.collection('activityLogs').add({
      user: 'admin',
      action: `deleted visitor`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Edit visitor (for sales)
app.post('/editVisitor', async (req, res) => {
  const { visitorId, changes, userId } = req.body;
  try {
    // Save pending edit
    await db.collection('pendingEdits').add({
      visitorId,
      changes,
      editedBy: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    // Update visitor status to Pending Approval
    await db.collection('visitors').doc(visitorId).update({ status: 'Pending Approval' });
    // Log activity
    await db.collection('activityLogs').add({
      user: userId,
      action: 'edit',
      visitorId,
      changes: JSON.stringify(changes),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create sales user (accessible from admin dashboard)
app.post('/createSalesUser', async (req, res) => {
  const { name, username, password } = req.body;
  try {
    // Validate input
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, username, password' });
    }
    
    // Check if username already exists
    const existingUser = await db.collection('salesUsers').where('username', '==', username).get();
    if (!existingUser.empty) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Create the sales user
    const docRef = await db.collection('salesUsers').add({ 
      name, 
      username, 
      password,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Log the activity
    await db.collection('activityLogs').add({
      user: 'admin',
      action: `created sales user: ${username}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, userId: docRef.id });
  } catch (error) {
    console.error('Error creating sales user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all sales users
app.get('/getSalesUsers', async (req, res) => {
  try {
    console.log('Fetching sales users...');
    const salesUsers = await db.collection('salesUsers').get();
    console.log('Number of sales users found:', salesUsers.docs.length);
    const userList = salesUsers.docs.map(doc => {
      const data = doc.data();
      console.log('User data:', { id: doc.id, ...data });
      return { 
        id: doc.id, 
        ...data 
      };
    });
    console.log('Returning user list:', userList);
    res.json(userList);
  } catch (error) {
    console.error('Error fetching sales users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a sales user
app.post('/deleteSalesUser', async (req, res) => {
  const { userId } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    await db.collection('salesUsers').doc(userId).delete();
    
    // Log the activity
    await db.collection('activityLogs').add({
      user: 'admin',
      action: `deleted sales user`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting sales user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a sales user
app.post('/updateSalesUser', async (req, res) => {
  const { userId, name, username, password } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // If username is being updated, check for duplicates
    if (username) {
      const existingUser = await db.collection('salesUsers').where('username', '==', username).get();
      if (!existingUser.empty && existingUser.docs[0].id !== userId) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    
    await db.collection('salesUsers').doc(userId).update(updateData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating sales user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get activity logs
app.get('/getActivityLogs', async (req, res) => {
  try {
    const logs = await db.collection('activityLogs').get();
    const logList = logs.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(log => {
        // Show only sales person activities (exclude admin activities)
        const isAdminUser = log.username?.toLowerCase() === 'admin' || 
                           log.user?.toLowerCase()?.includes('admin') ||
                           log.user === 'Administrator';
        return !isAdminUser;
      })
      .sort((a, b) => {
        // Sort by timestamp descending (newest first)
        const timeA = a.timestamp?.seconds || a.timestamp?._seconds || 0;
        const timeB = b.timestamp?.seconds || b.timestamp?._seconds || 0;
        return timeB - timeA;
      });
    res.json(logList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete selected activity logs
app.post('/deleteLogs', async (req, res) => {
  const { logIds } = req.body;
  console.log('Delete request received with logIds:', logIds);
  
  try {
    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      console.log('Invalid logIds:', logIds);
      return res.status(400).json({ error: 'Invalid or empty logIds' });
    }

    console.log(`Attempting to delete ${logIds.length} logs`);
    const batch = db.batch();
    
    logIds.forEach(logId => {
      console.log('Adding delete for logId:', logId);
      const docRef = db.collection('activityLogs').doc(logId);
      batch.delete(docRef);
    });
    
    const result = await batch.commit();
    console.log(`Successfully deleted ${logIds.length} activity logs, batch result:`, result);
    res.json({ success: true, deletedCount: logIds.length });
  } catch (error) {
    console.error('Error deleting logs:', error.message, error.code);
    res.status(500).json({ error: error.message || 'Failed to delete logs' });
  }
});

// Clear all activity logs
app.post('/clearAllLogs', async (req, res) => {
  console.log('Clear all logs request received');
  try {
    const allLogs = await db.collection('activityLogs').get();
    console.log(`Found ${allLogs.docs.length} logs to delete`);
    
    const batch = db.batch();
    
    allLogs.docs.forEach(doc => {
      console.log('Adding delete for log:', doc.id);
      batch.delete(doc.ref);
    });
    
    if (allLogs.docs.length > 0) {
      const result = await batch.commit();
      console.log(`Successfully cleared all ${allLogs.docs.length} activity logs`);
    } else {
      console.log('No logs to clear');
    }
    
    res.json({ success: true, deletedCount: allLogs.docs.length });
  } catch (error) {
    console.error('Error clearing logs:', error.message, error.code);
    res.status(500).json({ error: error.message || 'Failed to clear logs' });
  }
});

// Get pending edits
app.get('/getPendingEdits', async (req, res) => {
  try {
    const edits = await db.collection('pendingEdits').get();
    const editList = edits.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(editList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve edit
app.post('/approveEdit', async (req, res) => {
  const { editId } = req.body;
  try {
    const editDoc = await db.collection('pendingEdits').doc(editId).get();
    const editData = editDoc.data();
    await db.collection('visitors').doc(editData.visitorId).update(editData.changes);
    await db.collection('visitors').doc(editData.visitorId).update({ status: 'Approved', lastEditedBy: 'admin' });
    await db.collection('pendingEdits').doc(editId).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject edit
app.post('/rejectEdit', async (req, res) => {
  const { editId } = req.body;
  try {
    const editDoc = await db.collection('pendingEdits').doc(editId).get();
    const editData = editDoc.data();
    await db.collection('visitors').doc(editData.visitorId).update({ status: 'Rejected', lastEditedBy: 'admin' });
    await db.collection('pendingEdits').doc(editId).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save view reason submission
app.post('/viewReason', async (req, res) => {
  const { visitorId, field, reason } = req.body;
  try {
    // Get the sales user from session if available
    const salesUserName = req.body.salesUserName || 'Unknown';
    
    await db.collection('viewReasons').add({
      visitorId,
      field,
      reason,
      salesUserName,
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving view reason:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all view reasons
app.get('/getReasons', async (req, res) => {
  try {
    const reasons = await db.collection('viewReasons').orderBy('submittedAt', 'desc').get();
    const reasonsList = reasons.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(reasonsList);
  } catch (error) {
    console.error('Error fetching view reasons:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete selected view reasons
app.post('/deleteReasons', async (req, res) => {
  const { reasonIds } = req.body;
  console.log('Delete reasons request received with reasonIds:', reasonIds);
  
  try {
    if (!reasonIds || !Array.isArray(reasonIds) || reasonIds.length === 0) {
      console.log('Invalid reasonIds:', reasonIds);
      return res.status(400).json({ error: 'Invalid or empty reasonIds' });
    }

    console.log(`Attempting to delete ${reasonIds.length} reasons`);
    const batch = db.batch();
    
    reasonIds.forEach(reasonId => {
      console.log('Adding delete for reasonId:', reasonId);
      const docRef = db.collection('viewReasons').doc(reasonId);
      batch.delete(docRef);
    });
    
    const result = await batch.commit();
    console.log(`Successfully deleted ${reasonIds.length} view reasons, batch result:`, result);
    res.json({ success: true, deletedCount: reasonIds.length });
  } catch (error) {
    console.error('Error deleting reasons:', error.message, error.code);
    res.status(500).json({ error: error.message || 'Failed to delete reasons' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('GET /test');
  console.log('POST /login');
});