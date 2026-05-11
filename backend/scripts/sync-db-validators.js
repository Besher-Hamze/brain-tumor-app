const { MongoClient } = require('mongodb');

const uri =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/brain_tumor_db';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db();

  await db.command({
    collMod: 'users',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['full_name', 'email', 'password', 'role'],
        properties: {
          full_name: { bsonType: 'string' },
          email: { bsonType: 'string' },
          password: { bsonType: 'string' },
          role: { enum: ['admin', 'doctor', 'patient'] },
          specialty: { bsonType: 'string' },
          hospital: { bsonType: 'string' },
          phone: { bsonType: 'string' },
          profile_image: { bsonType: 'string' },
          is_active: { bsonType: 'bool' },
          last_login: { bsonType: 'date' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
          created_at: { bsonType: 'date' },
        },
      },
    },
    validationLevel: 'moderate',
  });

  await client.close();
  console.log('Database validators synced.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
