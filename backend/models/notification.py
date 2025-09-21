from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Notification:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.notifications
    
    def create_notification(self, recipient_id, title, message, notification_type='general'):
        """Create a new notification"""
        notification_data = {
            'userId': ObjectId(recipient_id),
            'title': title,
            'message': message,
            'type': notification_type,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now(),
            'isRead': False
        }
        
        result = self.collection.insert_one(notification_data)
        return str(result.inserted_id)
    
    def get_all_notifications(self):
        """Get all notifications with user details"""
        pipeline = [
            {'$lookup': {
                'from': 'students',
                'localField': 'userId',
                'foreignField': '_id',
                'as': 'user'
            }},
            {'$unwind': '$user'},
            {'$sort': {'createdAt': -1}}
        ]
        
        notifications = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(notifications)
    
    def get_user_notifications(self, user_id, is_read=None, limit=50):
        """Get notifications for a user"""
        filter_query = {'userId': ObjectId(user_id)}
        
        if is_read is not None:
            filter_query['isRead'] = is_read
        
        notifications = list(self.collection.find(filter_query)
                           .sort('createdAt', -1)
                           .limit(limit))
        
        return serialize_mongo_doc(notifications)
    
    def mark_as_read(self, notification_id, user_id):
        """Mark a notification as read"""
        result = self.collection.update_one(
            {
                '_id': ObjectId(notification_id),
                'userId': ObjectId(user_id)
            },
            {
                '$set': {
                    'isRead': True,
                    'readAt': datetime.now(),
                    'updatedAt': datetime.now()
                }
            }
        )
        return result.modified_count > 0
    
    def mark_all_as_read(self, user_id):
        """Mark all notifications as read for a user"""
        result = self.collection.update_many(
            {
                'userId': ObjectId(user_id),
                'isRead': False
            },
            {
                '$set': {
                    'isRead': True,
                    'readAt': datetime.now(),
                    'updatedAt': datetime.now()
                }
            }
        )
        return result.modified_count
    
    def get_unread_count(self, user_id):
        """Get count of unread notifications for a user"""
        count = self.collection.count_documents({
            'userId': ObjectId(user_id),
            'isRead': False
        })
        return count
    
    def delete_notification(self, notification_id, user_id):
        """Delete a notification"""
        result = self.collection.delete_one({
            '_id': ObjectId(notification_id),
            'userId': ObjectId(user_id)
        })
        return result.deleted_count > 0
    
    def broadcast_notification(self, notification_data, user_ids):
        """Send notification to multiple users"""
        notifications = []
        for user_id in user_ids:
            notification = notification_data.copy()
            notification['userId'] = ObjectId(user_id)
            notification['createdAt'] = datetime.now()
            notification['updatedAt'] = datetime.now()
            notification['isRead'] = False
            notifications.append(notification)
        
        if notifications:
            result = self.collection.insert_many(notifications)
            return len(result.inserted_ids)
        return 0
    
    def send_to_all_students(self, notification_data):
        """Send notification to all active students"""
        # Get all student user IDs
        students = list(self.db.users.find(
            {'role': 'student', 'isActive': True},
            {'_id': 1}
        ))
        
        student_ids = [str(student['_id']) for student in students]
        return self.broadcast_notification(notification_data, student_ids)
    
    def send_to_semester_students(self, notification_data, semester):
        """Send notification to students in a specific semester"""
        students = list(self.db.users.find(
            {
                'role': 'student',
                'profile.semester': semester,
                'isActive': True
            },
            {'_id': 1}
        ))
        
        student_ids = [str(student['_id']) for student in students]
        return self.broadcast_notification(notification_data, student_ids)
    
    def get_notification_stats(self):
        """Get notification statistics"""
        total_notifications = self.collection.count_documents({})
        unread_notifications = self.collection.count_documents({'isRead': False})
        
        # Category-wise count
        category_pipeline = [
            {'$group': {
                '_id': '$category',
                'count': {'$sum': 1}
            }}
        ]
        category_stats = list(self.collection.aggregate(category_pipeline))
        
        # Priority-wise count
        priority_pipeline = [
            {'$group': {
                '_id': '$priority',
                'count': {'$sum': 1}
            }}
        ]
        priority_stats = list(self.collection.aggregate(priority_pipeline))
        
        return {
            'totalNotifications': total_notifications,
            'unreadNotifications': unread_notifications,
            'categoryWise': serialize_mongo_doc(category_stats),
            'priorityWise': serialize_mongo_doc(priority_stats)
        }
    
    def cleanup_old_notifications(self, days=30):
        """Delete notifications older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        result = self.collection.delete_many({
            'createdAt': {'$lt': cutoff_date},
            'isRead': True
        })
        
        return result.deleted_count
