const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const database = require('./db');
const { sendFeatureRequestEmail } = require('./emailService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // Allow localhost for development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      
      // Allow all Railway domains
      if (origin.includes('.railway.app') || origin.includes('.railway.internal')) {
        return callback(null, true);
      }
      
      callback(null, true); // Allow all origins
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware - CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow all Railway domains
    if (origin.includes('.railway.app') || origin.includes('.railway.internal')) {
      return callback(null, true);
    }
    
    // Allow any origin in development, restrict in production if needed
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all origins for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Properties will be loaded from database on startup

// JWT secret - in production, use a secure random string
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes
// Note: DELETE /api/properties must come before GET /api/properties/:id
// to avoid route conflicts

// Delete all properties (admin only) - MUST be before /api/properties/:id
app.delete('/api/properties', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await database.deleteAllProperties();
    const deletedCount = result.count;
    console.log(`Deleting all ${deletedCount} properties`);
    
    // Broadcast deletion to all connected clients
    io.emit('allPropertiesDeleted', { count: deletedCount });
    
    console.log(`Successfully deleted all ${deletedCount} properties`);
    res.json({
      message: `Deleted ${deletedCount} properties`,
      count: deletedCount
    });
  } catch (error) {
    console.error('Error deleting all properties:', error);
    res.status(500).json({ error: 'Failed to delete all properties', details: error.message });
  }
});

app.get('/api/properties', async (req, res) => {
  try {
    const properties = await database.getAllProperties();
    console.log(`GET /api/properties: Returning ${properties.length} properties`);
    // Transform properties to include both position and coordinates
    const transformedProperties = properties.map(prop => ({
      ...prop,
      coordinates: prop.coordinates || prop.position,
      position: prop.position || prop.coordinates
    }));
    res.json(transformedProperties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties', details: error.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await database.getPropertyById(parseInt(req.params.id));
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    // Transform to include both position and coordinates
    const transformedProperty = {
      ...property,
      coordinates: property.coordinates || property.position,
      position: property.position || property.coordinates
    };
    res.json(transformedProperty);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

app.put('/api/properties/:id', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const existingProperty = await database.getPropertyById(propertyId);
    
    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Prepare updates - support both 'coordinates' and 'position'
    const updates = {
      ...req.body,
      coordinates: req.body.coordinates || req.body.position || existingProperty.coordinates,
      position: req.body.coordinates || req.body.position || existingProperty.position
    };

    const updatedProperty = await database.updateProperty(propertyId, updates);

    // Transform to include both position and coordinates
    const transformedProperty = {
      ...updatedProperty,
      coordinates: updatedProperty.coordinates || updatedProperty.position,
      position: updatedProperty.position || updatedProperty.coordinates
    };

    // Broadcast update to all connected clients
    io.emit('propertyUpdated', transformedProperty);

    res.json(transformedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

app.post('/api/properties', authenticateToken, async (req, res) => {
  try {
    // Get user info from token
    const userId = req.user.id;
    const userName = req.user.name || req.user.email;
    
    const propertyData = {
      address: req.body.address,
      zoning: req.body.zoning || 'Residential',
      value: req.body.value || 200000,
      notes: req.body.notes || '',
      taxValue: req.body.taxValue,
      assessedValue: req.body.assessedValue,
      capRate: req.body.capRate,
      monthlyPayment: req.body.monthlyPayment,
      // Support both 'coordinates' (frontend) and 'position' (backend)
      coordinates: req.body.coordinates || req.body.position,
      position: req.body.coordinates || req.body.position,
      createdBy: userId,
      createdByName: userName
    };

    console.log('Creating property:', { address: propertyData.address, createdBy: userName });
    const newProperty = await database.createProperty(propertyData);
    console.log('Property created successfully with ID:', newProperty.id);

    // Transform to include both position and coordinates
    const transformedProperty = {
      ...newProperty,
      coordinates: newProperty.coordinates || newProperty.position,
      position: newProperty.position || newProperty.coordinates
    };

    // Broadcast new property to all connected clients
    io.emit('propertyCreated', transformedProperty);

    res.status(201).json(transformedProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property', details: error.message });
  }
});

// Delete property (admin only)
app.delete('/api/properties/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const result = await database.deleteProperty(propertyId);
    
    if (!result.deleted) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Broadcast deletion to all connected clients
    io.emit('propertyDeleted', { id: propertyId });

    res.json({ message: 'Property deleted successfully', id: propertyId });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Vote on property (thumbs up/down)
app.post('/api/properties/:id/vote', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { vote } = req.body; // 'up' or 'down'
    
    const existingProperty = await database.getPropertyById(propertyId);
    
    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const updates = {};
    if (vote === 'up') {
      updates.thumbsUp = (existingProperty.thumbsUp || 0) + 1;
    } else if (vote === 'down') {
      updates.thumbsDown = (existingProperty.thumbsDown || 0) + 1;
    } else {
      return res.status(400).json({ error: 'Invalid vote. Must be "up" or "down"' });
    }

    const updatedProperty = await database.updateProperty(propertyId, updates);

    // Transform to include both position and coordinates
    const transformedProperty = {
      ...updatedProperty,
      coordinates: updatedProperty.coordinates || updatedProperty.position,
      position: updatedProperty.position || updatedProperty.coordinates
    };

    // Broadcast update to all connected clients
    io.emit('propertyUpdated', transformedProperty);

    res.json(transformedProperty);
  } catch (error) {
    console.error('Error voting on property:', error);
    res.status(500).json({ error: 'Failed to vote on property' });
  }
});

// Zillow estimate endpoint (proxy/scraper)
app.post('/api/zillow-estimate', async (req, res) => {
  const { address, coordinates } = req.body;
  
  try {
    // Note: Zillow doesn't have a public API anymore
    // This is a placeholder for integrating with:
    // 1. A property valuation API service
    // 2. A web scraper (must respect rate limits and ToS)
    // 3. A third-party service that provides Zillow estimates
    
    // For now, we'll return a mock response
    // In production, you'd want to:
    // - Use a service like PropertyRadar, HomeSnap, or RapidAPI
    // - Or implement a scraper with proper rate limiting and caching
    // - Or use a property data aggregator API
    
    // Example: Try to construct Zillow URL and estimate
    // You could use puppeteer/playwright to scrape, but that's resource-intensive
    // Better to use a dedicated property API service
    
    // For demo: return a rough estimate based on address/location
    // In production, replace this with actual API call
    
    // Try to get estimate from a property data service
    // This is a placeholder - implement with actual service
    const estimate = await getPropertyEstimate(address, coordinates);
    
    res.json({
      zestimate: estimate.value,
      url: `https://www.zillow.com/homedetails/${encodeURIComponent(address)}`,
      range: estimate.range
    });
  } catch (error) {
    console.error('Error fetching Zillow estimate:', error);
    // Return empty response on error - frontend will handle gracefully
    res.json({});
  }
});

// Helper function to get property estimate
// Uses web scraping to get Zillow estimate (respects rate limits)
async function getPropertyEstimate(address, coordinates) {
  try {
    // Construct search URL for Zillow - try multiple URL formats
    const searchAddress = encodeURIComponent(address + ', Columbus, OH');
    const searchAddressNoCity = encodeURIComponent(address);
    
    // Try different Zillow URL formats
    const zillowUrls = [
      `https://www.zillow.com/homes/${searchAddress}_rb/`,
      `https://www.zillow.com/homedetails/${searchAddress}/`,
      `https://www.zillow.com/search/${searchAddressNoCity}/`
    ];
    
    // Try to fetch and parse Zillow page
    for (const zillowSearchUrl of zillowUrls) {
      try {
        const response = await axios.get(zillowSearchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.zillow.com/',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin'
          },
          timeout: 10000,
          maxRedirects: 5
        });
        
        const html = response.data;
        console.log(`Fetched Zillow page, length: ${html.length} bytes`);
        
        // Method 1: Look for Zestimate in script tags with specific patterns
        // Zillow often embeds data in window.mapResults or similar
        const zestimatePatterns = [
          // Look for "zestimate" or "Zestimate" with price
          /["']zestimate["']\s*:\s*["']?\$?(\d{1,3}(?:,\d{3})*)["']?/i,
          /Zestimate[^:]*:[\s\$]*(\d{1,3}(?:,\d{3})*)/i,
          // Look for JSON data with price information
          /"price":\s*(\d{5,})/,
          /"value":\s*(\d{5,})/,
          // Look for data-testid or data attributes
          /data-testid="zestimate"[^>]*>[\s\$]*(\d{1,3}(?:,\d{3})*)/i,
          // Look in span/div with Zestimate text
          /<[^>]*>Zestimate[^<]*<[^>]*>[\s\$]*(\d{1,3}(?:,\d{3})*)/i,
          // Generic price patterns near "zestimate" keyword
          /zestimate[^$]*\$(\d{1,3}(?:,\d{3}){2,})/i
        ];
        
        for (const pattern of zestimatePatterns) {
          const matches = [...html.matchAll(new RegExp(pattern.source, 'gi'))];
          for (const match of matches) {
            if (match[1]) {
              const price = parseInt(match[1].replace(/,/g, '').replace(/\$/g, ''));
              if (price > 50000 && price < 5000000) { // Reasonable price range
                console.log(`Found Zestimate using pattern: ${price}`);
                return {
                  value: price,
                  range: null
                };
              }
            }
          }
        }
        
        // Method 2: Look for JSON-LD structured data
        const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
        for (const match of jsonLdMatches) {
          try {
            const jsonLd = JSON.parse(match[1]);
            // Check for price in various JSON-LD formats
            if (jsonLd.offers && jsonLd.offers.price) {
              const price = typeof jsonLd.offers.price === 'number' 
                ? jsonLd.offers.price 
                : parseInt(jsonLd.offers.price.replace(/,/g, ''));
              if (price > 50000 && price < 5000000) {
                console.log(`Found price in JSON-LD: ${price}`);
                return { value: price, range: null };
              }
            }
            if (jsonLd.price) {
              const price = typeof jsonLd.price === 'number' 
                ? jsonLd.price 
                : parseInt(jsonLd.price.replace(/,/g, ''));
              if (price > 50000 && price < 5000000) {
                console.log(`Found price in JSON-LD: ${price}`);
                return { value: price, range: null };
              }
            }
          } catch (e) {
            // Continue to next JSON-LD block
          }
        }
        
        // Method 3: Look for window.__PRELOADED_STATE__ or similar data stores
        const preloadedStateMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({.+?});/s);
        if (preloadedStateMatch) {
          try {
            const state = JSON.parse(preloadedStateMatch[1]);
            // Navigate through state to find Zestimate
            const findZestimate = (obj) => {
              if (!obj || typeof obj !== 'object') return null;
              for (const key in obj) {
                if (key.toLowerCase().includes('zestimate') && typeof obj[key] === 'number') {
                  return obj[key];
                }
                if (key.toLowerCase().includes('price') && typeof obj[key] === 'number' && obj[key] > 50000) {
                  return obj[key];
                }
                const result = findZestimate(obj[key]);
                if (result) return result;
              }
              return null;
            };
            const found = findZestimate(state);
            if (found && found > 50000 && found < 5000000) {
              console.log(`Found Zestimate in preloaded state: ${found}`);
              return { value: found, range: null };
            }
          } catch (e) {
            // Continue
          }
        }
        
      } catch (error) {
        console.log(`Could not fetch from URL ${zillowSearchUrl}:`, error.message);
        continue; // Try next URL
      }
    }
    
    console.log('Could not extract Zestimate from Zillow pages, using fallback');
    // Fallback: Return null instead of fake estimate
    // This way the frontend knows we didn't get a real value
    return {
      value: null,
      range: null
    };
  } catch (error) {
    console.error('Error estimating property value:', error);
    return {
      value: null,
      range: null
    };
  }
}

// Refresh Zillow values for all properties or a specific property
app.post('/api/properties/refresh-zillow', async (req, res) => {
  const { propertyId } = req.body; // Optional: if provided, refresh only that property
  
  try {
    const propertiesToUpdate = propertyId 
      ? properties.filter(p => p.id === parseInt(propertyId))
      : properties;
    
    if (propertiesToUpdate.length === 0) {
      return res.json({
        message: 'No properties to refresh',
        properties: []
      });
    }
    
    const updatedProperties = [];
    
    for (const property of propertiesToUpdate) {
      try {
        const address = property.address;
        const coordinates = property.coordinates || property.position;
        
        console.log(`Attempting to refresh property ${property.id}: ${address}`);
        const estimate = await getPropertyEstimate(address, coordinates);
        
        if (estimate && estimate.value) {
          const propertyIndex = properties.findIndex(p => p.id === property.id);
          if (propertyIndex !== -1) {
            // Only update zillowValue, don't change the main value
            properties[propertyIndex].zillowValue = estimate.value;
            properties[propertyIndex].lastUpdated = new Date().toISOString();
            
            const updatedProperty = properties[propertyIndex];
            
            // Broadcast update to all connected clients
            io.emit('propertyUpdated', updatedProperty);
            
            updatedProperties.push(updatedProperty);
            console.log(`Successfully updated property ${property.id} with Zillow value ${estimate.value}`);
          }
        } else {
          console.log(`No Zestimate found for property ${property.id} (${address})`);
        }
      } catch (error) {
        console.error(`Error refreshing property ${property.id}:`, error.message);
        // Continue with next property
      }
    }
    
    console.log(`Refresh complete: ${updatedProperties.length} properties updated`);
    res.json({
      message: `Refreshed ${updatedProperties.length} of ${propertiesToUpdate.length} properties`,
      properties: updatedProperties
    });
  } catch (error) {
    console.error('Error refreshing Zillow values:', error);
    res.status(500).json({ error: 'Failed to refresh Zillow values', details: error.message });
  }
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await database.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await database.verifyPassword(email, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User management routes (admin only)
// Get all users
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await database.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await database.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (admin only)
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, name, password, role, username, first_name, last_name } = req.body;

    if (!email || !name || !password || !username || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, name, username, first name, last name, and password are required' });
    }

    const userRole = role || 'viewer';
    if (!['admin', 'viewer', 'editor'].includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, viewer, or editor' });
    }

    const newUser = await database.createUser(email, name, password, userRole, username, first_name, last_name);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updates = req.body;

    // Don't allow updating your own role (security measure)
    if (updates.role && userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const updatedUser = await database.updateUser(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Don't allow deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await database.deleteUser(userId);
    res.json({ message: 'User deleted successfully', id: userId });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Feature request endpoint
app.post('/api/feature-request', async (req, res) => {
  try {
    const { description, userEmail } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Feature description is required' });
    }

    const result = await sendFeatureRequestEmail(description.trim(), userEmail || 'Not provided');

    if (result.success) {
      res.json({ 
        message: 'Feature request sent successfully',
        messageId: result.messageId 
      });
    } else {
      console.error('Failed to send feature request email:', result.error);
      res.status(500).json({ 
        error: 'Failed to send feature request',
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error processing feature request:', error);
    res.status(500).json({ error: 'Failed to process feature request' });
  }
});

// Feature request endpoint
app.post('/api/feature-request', async (req, res) => {
  try {
    const { description, userEmail } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Feature description is required' });
    }

    const result = await sendFeatureRequestEmail(description.trim(), userEmail || 'Not provided');

    if (result.success) {
      res.json({ 
        message: 'Feature request sent successfully',
        messageId: result.messageId 
      });
    } else {
      console.error('Failed to send feature request email:', result.error);
      res.status(500).json({ 
        error: 'Failed to send feature request',
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error processing feature request:', error);
    res.status(500).json({ error: 'Failed to process feature request' });
  }
});

// Socket.io for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinProperty', (propertyId) => {
    socket.join(`property-${propertyId}`);
    console.log(`User ${socket.id} joined property ${propertyId}`);
  });

  socket.on('leaveProperty', (propertyId) => {
    socket.leave(`property-${propertyId}`);
    console.log(`User ${socket.id} left property ${propertyId}`);
  });

  socket.on('propertyNoteUpdate', (data) => {
    // Broadcast note updates to all users viewing this property
    socket.to(`property-${data.propertyId}`).emit('propertyNoteUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

database.initialize()
  .then(async () => {
    // Log existing properties on startup for debugging
    try {
      const allProperties = await database.getAllProperties();
      console.log(`Loaded ${allProperties.length} properties from database`);
      if (allProperties.length > 0) {
        console.log('Properties:', allProperties.map(p => ({ id: p.id, address: p.address, createdBy: p.createdByName })));
      }
    } catch (err) {
      console.error('Error loading properties on startup:', err);
    }
    
    // Clean up old hardcoded properties on startup (development only)
    // Only run once - check if we've already cleaned up by looking for a flag
    if (process.env.NODE_ENV !== 'production') {
      try {
        const allProperties = await database.getAllProperties();
        const oldProperties = allProperties.filter(p => 
          p.address === '123 High Street' || 
          p.address === '456 North Broadway' || 
          p.address === '789 Indianola Avenue'
        );
        
        if (oldProperties.length > 0) {
          console.log(`Found ${oldProperties.length} old hardcoded properties, removing them...`);
          for (const prop of oldProperties) {
            await database.deleteProperty(prop.id);
          }
          console.log('Old properties removed successfully');
        }
      } catch (err) {
        console.error('Error cleaning up old properties:', err);
      }
    }
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Default admin: admin@clintonville.com / admin123`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await database.close();
  process.exit(0);
});
