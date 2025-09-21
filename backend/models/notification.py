from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Notification:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.notification
    
    def create_notification(self, title, content, priority, author, due_date):
        """Create a new notification"""
        notification_data = {
            'title': title,
            'content': content,
            'priority': priority,  # low, medium, high, urgent
            'author': author,
            'due_date': due_date,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        result = self.collection.insert_one(notification_data)
        return str(result.inserted_id)
    
    def get_all_notifications(self):
        """Get all notifications"""
        notifications = list(self.collection.find().sort('createdAt', -1))
        return serialize_mongo_doc(notifications)
    
    def get_notifications_by_priority(self, priority):
        """Get notifications by priority"""
        notifications = list(self.collection.find({'priority': priority}).sort('createdAt', -1))
        return serialize_mongo_doc(notifications)
    
    def get_notifications_by_author(self, author):
        """Get notifications by author"""
        notifications = list(self.collection.find({'author': author}).sort('createdAt', -1))
        return serialize_mongo_doc(notifications)
    
    def get_upcoming_notifications(self, days_ahead=7):
        """Get notifications with due dates in the next few days"""
        from datetime import timedelta
        cutoff_date = datetime.now() + timedelta(days=days_ahead)
        
        notifications = list(self.collection.find({
            'due_date': {'$lte': cutoff_date, '$gte': datetime.now()}
        }).sort('due_date', 1))
        
        return serialize_mongo_doc(notifications)
    
    def update_notification(self, notification_id, title=None, content=None, priority=None, author=None, due_date=None):
        """Update a notification"""
        update_data = {'updatedAt': datetime.now()}
        
        if title:
            update_data['title'] = title
        if content:
            update_data['content'] = content
        if priority:
            update_data['priority'] = priority
        if author:
            update_data['author'] = author
        if due_date:
            update_data['due_date'] = due_date
        
        result = self.collection.update_one(
            {'_id': ObjectId(notification_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def delete_notification(self, notification_id):
        """Delete a notification"""
        result = self.collection.delete_one({'_id': ObjectId(notification_id)})
        return result.deleted_count > 0
    
    def get_notification_stats(self):
        """Get notification statistics"""
        total_notifications = self.collection.count_documents({})
        
        # Priority-wise count
        priority_pipeline = [
            {'$group': {
                '_id': '$priority',
                'count': {'$sum': 1}
            }},
            {'$sort': {'count': -1}}
        ]
        priority_stats = list(self.collection.aggregate(priority_pipeline))
        
        # Author-wise count
        author_pipeline = [
            {'$group': {
                '_id': '$author',
                'count': {'$sum': 1}
            }},
            {'$sort': {'count': -1}}
        ]
        author_stats = list(self.collection.aggregate(author_pipeline))
        
        return {
            'total_notifications': total_notifications,
            'priority_wise': serialize_mongo_doc(priority_stats),
            'author_wise': serialize_mongo_doc(author_stats)
        }
    
    def search_notifications(self, query):
        """Search notifications by title, content, or author"""
        search_filter = {
            '$or': [
                {'title': {'$regex': query, '$options': 'i'}},
                {'content': {'$regex': query, '$options': 'i'}},
                {'author': {'$regex': query, '$options': 'i'}}
            ]
        }
        
        notifications = list(self.collection.find(search_filter).sort('createdAt', -1))
        return serialize_mongo_doc(notifications)
