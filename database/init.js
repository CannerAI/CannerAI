// MongoDB initialization script for Canner application
// This script initializes the MongoDB database with the required collections and indexes

db = db.getSiblingDB('canner_dev');

// Create canned_responses collection if it doesn't exist
db.createCollection('canned_responses');

print('✅ Created canned_responses collection');

// Create indexes for better query performance

// Text index on title and content for full-text search
db.canned_responses.createIndex(
  { title: 'text', content: 'text' },
  { 
    name: 'idx_canned_responses_text_search',
    weights: { title: 2, content: 1 },
    default_language: 'english'
  }
);
print('✅ Created text search index on title and content');

// Index on tags array for tag-based searches
db.canned_responses.createIndex(
  { tags: 1 },
  { name: 'idx_canned_responses_tags' }
);
print('✅ Created index on tags');

// Index on created_at for chronological queries (descending)
db.canned_responses.createIndex(
  { created_at: -1 },
  { name: 'idx_canned_responses_created_at' }
);
print('✅ Created index on created_at');

// Index on updated_at for recent updates
db.canned_responses.createIndex(
  { updated_at: -1 },
  { name: 'idx_canned_responses_updated_at' }
);
print('✅ Created index on updated_at');

print('🎉 MongoDB initialization complete!');
