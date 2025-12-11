console.log('sendNotificationToStudents.js loaded');
// Utility to send notifications to all students when admin uploads a paper
import { supabase } from '../supabase/client';

/**
 * Sends a notification to all students when a new paper is uploaded by admin.
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
export async function sendNotificationToStudents(title, message) {
  console.log('Entered sendNotificationToStudents');
  try {
    // Fetch all student users
    const { data: students, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'student');

    console.log('Fetched students:', students);
    if (userError) {
      console.error('Error fetching students:', userError);
      throw userError;
    }
    if (!students || students.length === 0) {
      console.warn('No students found to notify.');
      return;
    }

    // Prepare notifications
    const notifications = students.map(student => ({
      user_id: student.id,
      title,
      message,
      read: false,
    }));
    console.log('Prepared notifications:', notifications);

    // Insert notifications
    const { error: notifError, data: notifData } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error inserting notifications:', notifError);
      throw notifError;
    }
    console.log('Inserted notifications:', notifData);
  } catch (err) {
    console.error('sendNotificationToStudents error:', err);
  }
}
