/**
 * Express application: middleware, CORS, and route mounting.
 * Routes are mounted here; core logic stays in use cases and ports.
 */

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Health check for basic service availability
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// TODO: mount routes (e.g. secureInquiry) when implemented
// const secureInquiryRoute = require('./src/routes/secureInquiry.route');
// app.use(secureInquiryRoute);

module.exports = app;
