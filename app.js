'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const companyRoutes = require('./routes/companyRoutes');
const fileRoutes = require('./routes/fileRoutes');
const locationRoutes = require('./routes/locationRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const clientRoutes = require('./routes/clientRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const activityRoutes = require('./routes/activityRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reservedQuantityRoutes = require('./routes/reservedQuantityRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const priceOptimizationRoutes = require('./routes/priceOptimizationRoutes');
const crossSellRoutes = require('./routes/crossSellRoutes');
const stockoutImpactRoutes = require('./routes/stockoutImpactRoutes');
const productPerformanceRoutes = require('./routes/productPerformanceRoutes');
const slowMovingRoutes = require('./routes/slowMovingRoutes');
const posTerminalRoutes = require('./routes/posTerminalRoutes');
const posSaleRoutes = require('./routes/posSaleRoutes');
const { trimRequestData } = require('./middleware/trimMiddleware');

// Create Express app
const app = express();

// Security middleware with relaxed CORS policy for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trim whitespace from all incoming request data
app.use(trimRequestData);

// Serve uploaded files as static content
app.use('/uploads', express.static('uploads'));

// Serve client static files (CSS, JS, images, etc.)
app.use(express.static('public/client'));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stockMovements', stockMovementRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reserved-quantities', reservedQuantityRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/price-optimization', priceOptimizationRoutes);
app.use('/api/cross-sell', crossSellRoutes);
app.use('/api/stockout-impact', stockoutImpactRoutes);
app.use('/api/product-performance', productPerformanceRoutes);
app.use('/api/slow-moving', slowMovingRoutes);
app.use('/api/pos-terminals', posTerminalRoutes);
app.use('/api/pos-sales', posSaleRoutes);


// Catch-all handler: serve index.html for client-side routing
// This should handle all non-API routes
app.use((req, res, next) => {
  // Skip if this is an API route or already handled
  if (req.path.startsWith('/api/') || req.method !== 'GET') {
    return next();
  }
  
  // Serve the index.html for client-side routing
  res.sendFile('index.html', { root: 'public/client' }, (err) => {
    if (err) {
      next(err);
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors
    });
  }
  
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Database validation error',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      field: error.errors[0]?.path
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      error: error.message,
      stack: error.stack 
    })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
