const { MongoClient } = require('mongodb');

async function clearDatabase() {
  const uri = "mongodb+srv://hackathonosinfo_db_user:6FrHRTNfyvAl7B@cluster0.imwnm8j.mongodb.net/dogfood_os?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri, {
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('dogfood_os');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections to clear`);

    if (collections.length === 0) {
      console.log('✅ Database is already empty!');
      return;
    }

    // Delete all documents from each collection (instead of dropping collections)
    for (const collection of collections) {
      const collectionName = collection.name;
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`Cleared collection "${collectionName}": ${result.deletedCount} documents deleted`);
    }

    console.log('✅ All database entries cleared successfully!');
    console.log('🚀 You can now start fresh with your application.');

  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    console.log('');
    console.log('💡 Alternative methods to clear the database:');
    console.log('1. Use MongoDB Atlas web interface at: https://cloud.mongodb.com/');
    console.log('2. Use MongoDB Compass application');
    console.log('3. Run the API server and use the admin endpoints');
  } finally {
    await client.close();
  }
}

clearDatabase();