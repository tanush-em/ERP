from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class User:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.users
    
    def create_user(self, user_data):
        """Create a new user"""
        user_data['createdAt'] = datetime.now()
        user_data['updatedAt'] = datetime.now()
        user_data['isActive'] = True
        
        result = self.collection.insert_one(user_data)
        return str(result.inserted_id)
    
    def find_by_username(self, username):
        """Find user by username"""
        user = self.collection.find_one({'username': username, 'isActive': True})
        return serialize_mongo_doc(user)
    
    def find_by_email(self, email):
        """Find user by email"""
        user = self.collection.find_one({'email': email, 'isActive': True})
        return serialize_mongo_doc(user)
    
    def find_by_id(self, user_id):
        """Find user by ID"""
        user = self.collection.find_one({'_id': ObjectId(user_id), 'isActive': True})
        return serialize_mongo_doc(user)
    
    def update_user(self, user_id, update_data):
        """Update user data"""
        update_data['updatedAt'] = datetime.now()
        result = self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def get_all_users(self, role=None):
        """Get all users, optionally filtered by role"""
        query = {'isActive': True}
        if role:
            query['role'] = role
            
        users = list(self.collection.find(query).sort('profile.firstName', 1))
        return serialize_mongo_doc(users)
    
    def deactivate_user(self, user_id):
        """Deactivate a user"""
        result = self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'isActive': False, 'updatedAt': datetime.now()}}
        )
        return result.modified_count > 0
