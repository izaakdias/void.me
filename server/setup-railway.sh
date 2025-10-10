#!/bin/bash

# Railway Production Setup Script
echo "🚂 Setting up Railway production environment..."

# Check if we're in production
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  This script should only run in production environment"
    exit 1
fi

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
sleep 5

# Run database setup
echo "🗄️  Setting up database schema..."
node -e "
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

client.connect()
    .then(() => {
        console.log('✅ Connected to PostgreSQL');
        const schema = fs.readFileSync('./railway-schema.sql', 'utf8');
        return client.query(schema);
    })
    .then(() => {
        console.log('✅ Database schema created successfully');
        return client.end();
    })
    .catch(err => {
        console.error('❌ Database setup failed:', err);
        process.exit(1);
    });
"

echo "🎉 Railway setup completed!"
