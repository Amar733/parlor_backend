const cron = require('node-cron');
const Appointment = require('../models/Appointment');

const initMeetingCron = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('Running meeting expiry cron job...');
      const now = new Date();
      // Find online appointments that are 'scheduled' but past their end time (approximated by start time + duration)
      // Or simply past their schedule date + some buffer (e.g. 2 hours)
      
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // We look for appointments where:
      // 1. type is 'online'
      // 2. meeting.status is 'scheduled'
      // 3. The appointment date/time is older than 2 hours ago
      
      // Note: Appointment date is stored as a string "YYYY-MM-DD" and time "HH:mm".
      // Use Mongo aggregation or find to filter.
      // For simplicity, let's fetch pending online appointments and check JS side or use a query if date/time logic allows.
      // Since date/time are strings, strict comparison is hard in simple query. 
      // We can check 'date' string. If date is yesterday or earlier, definitely expired.
      // For today, check time.

      // Let's create a simpler rule: Expire any 'scheduled' meeting where the appointment date is before today.
      const todayStr = now.toISOString().split('T')[0];

      const result = await Appointment.updateMany(
        {
          type: 'online',
          'meeting.status': 'scheduled',
          date: { $lt: todayStr }
        },
        {
          $set: { 'meeting.status': 'expired' }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Expired ${result.modifiedCount} old meetings from previous days.`);
      }

      // TODO: More granular check for today's meetings if needed (e.g. check time)
      
    } catch (error) {
      console.error('Error in meeting expiry cron:', error);
    }
  });
};

module.exports = initMeetingCron;
