import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import * as EmailService from '../services/email-service';

const router = Router();

/**
 * Send an email notification for a new claim
 */
router.post('/notify/claim-created', async (req: Request, res: Response) => {
  try {
    const { claimId, recipientEmail } = req.body;
    
    if (!claimId || !recipientEmail) {
      return res.status(400).json({ error: 'claimId and recipientEmail are required' });
    }
    
    const claim = await storage.getClaim(Number(claimId));
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    const success = await EmailService.sendClaimCreatedNotification(claim, recipientEmail);
    
    if (success) {
      // Record this activity
      await storage.createActivity({
        claimId: claim.id,
        type: 'notification',
        description: `Claim creation notification sent to ${recipientEmail}`,
        createdBy: req.body.createdBy || 'system'
      });
      
      return res.status(200).json({ message: 'Notification sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send notification' });
    }
  } catch (error) {
    console.error('Error sending claim creation notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send an email notification for a claim status update
 */
router.post('/notify/status-update', async (req: Request, res: Response) => {
  try {
    const { claimId, oldStatus, recipientEmail } = req.body;
    
    if (!claimId || !oldStatus || !recipientEmail) {
      return res.status(400).json({ error: 'claimId, oldStatus, and recipientEmail are required' });
    }
    
    const claim = await storage.getClaim(Number(claimId));
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    const success = await EmailService.sendClaimStatusUpdateNotification(claim, oldStatus, recipientEmail);
    
    if (success) {
      // Record this activity
      await storage.createActivity({
        claimId: claim.id,
        type: 'notification',
        description: `Status update notification sent to ${recipientEmail}`,
        createdBy: req.body.createdBy || 'system'
      });
      
      return res.status(200).json({ message: 'Notification sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send notification' });
    }
  } catch (error) {
    console.error('Error sending status update notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send an email notification for a task assignment
 */
router.post('/notify/task-assigned', async (req: Request, res: Response) => {
  try {
    const { taskId, assigneeEmail } = req.body;
    
    if (!taskId || !assigneeEmail) {
      return res.status(400).json({ error: 'taskId and assigneeEmail are required' });
    }
    
    const task = await storage.getTask(Number(taskId));
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (!task.claimId) {
      return res.status(400).json({ error: 'Task has no associated claim' });
    }
    
    const claim = await storage.getClaim(task.claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Related claim not found' });
    }
    
    const success = await EmailService.sendTaskAssignmentNotification(task, claim, assigneeEmail);
    
    if (success) {
      // Record this activity
      await storage.createActivity({
        claimId: claim.id,
        type: 'notification',
        description: `Task assignment notification sent to ${assigneeEmail}`,
        createdBy: req.body.createdBy || 'system'
      });
      
      return res.status(200).json({ message: 'Notification sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send notification' });
    }
  } catch (error) {
    console.error('Error sending task assignment notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send an email notification for overdue tasks
 */
router.post('/notify/overdue-task', async (req: Request, res: Response) => {
  try {
    const { taskId, recipientEmail } = req.body;
    
    if (!taskId || !recipientEmail) {
      return res.status(400).json({ error: 'taskId and recipientEmail are required' });
    }
    
    const task = await storage.getTask(Number(taskId));
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (!task.claimId) {
      return res.status(400).json({ error: 'Task has no associated claim' });
    }
    
    const claim = await storage.getClaim(task.claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Related claim not found' });
    }
    
    const success = await EmailService.sendOverdueTaskNotification(task, claim, recipientEmail);
    
    if (success) {
      // Record this activity
      await storage.createActivity({
        claimId: claim.id,
        type: 'notification',
        description: `Overdue task notification sent to ${recipientEmail} for task: ${task.title}`,
        createdBy: req.body.createdBy || 'system'
      });
      
      return res.status(200).json({ message: 'Overdue task notification sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send notification' });
    }
  } catch (error) {
    console.error('Error sending overdue task notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send an email notification for a document upload
 */
router.post('/notify/document-uploaded', async (req: Request, res: Response) => {
  try {
    const { documentId, recipientEmail } = req.body;
    
    if (!documentId || !recipientEmail) {
      return res.status(400).json({ error: 'documentId and recipientEmail are required' });
    }
    
    const document = await storage.getDocument(Number(documentId));
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (!document.claimId) {
      return res.status(400).json({ error: 'Document has no associated claim' });
    }
    
    const claim = await storage.getClaim(document.claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Related claim not found' });
    }
    
    const success = await EmailService.sendDocumentUploadNotification(document, claim, recipientEmail);
    
    if (success) {
      // Record this activity
      await storage.createActivity({
        claimId: claim.id,
        type: 'notification',
        description: `Document upload notification sent to ${recipientEmail}`,
        createdBy: req.body.createdBy || 'system'
      });
      
      return res.status(200).json({ message: 'Notification sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send notification' });
    }
  } catch (error) {
    console.error('Error sending document upload notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send weekly summary report
 */
router.post('/notify/weekly-summary', async (req: Request, res: Response) => {
  try {
    const { recipientEmails } = req.body;
    
    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return res.status(400).json({ error: 'recipientEmails array is required' });
    }
    
    const claims = await storage.getClaims();
    const tasks = await storage.getTasks();
    
    const results = await Promise.all(
      recipientEmails.map(async (email) => {
        const success = await EmailService.sendWeeklyClaimSummary(claims, tasks, email);
        return { email, success };
      })
    );
    
    const allSuccessful = results.every(r => r.success);
    const failedEmails = results.filter(r => !r.success).map(r => r.email);
    
    if (allSuccessful) {
      return res.status(200).json({ message: 'Weekly summaries sent successfully to all recipients' });
    } else {
      return res.status(207).json({ 
        message: 'Weekly summaries sent with some failures', 
        failedRecipients: failedEmails 
      });
    }
  } catch (error) {
    console.error('Error sending weekly summary:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send templated email
 */
router.post('/send-templated', async (req: Request, res: Response) => {
  try {
    const { templateName, recipientEmail, templateData } = req.body;
    
    if (!templateName || !recipientEmail || !templateData) {
      return res.status(400).json({ error: 'templateName, recipientEmail, and templateData are required' });
    }
    
    // Verify that the template exists in our database
    const template = await storage.getEmailTemplateByName(templateName);
    if (!template) {
      return res.status(404).json({ error: 'Email template not found' });
    }
    
    const success = await EmailService.sendTemplatedEmail(templateName, recipientEmail, templateData);
    
    if (success) {
      // If this is related to a claim, record the activity
      if (templateData.claimId) {
        await storage.createActivity({
          claimId: Number(templateData.claimId),
          type: 'notification',
          description: `${templateName} email sent to ${recipientEmail}`,
          createdBy: req.body.createdBy || 'system'
        });
      }
      
      return res.status(200).json({ message: 'Email sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending templated email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send notifications for all overdue tasks
 */
router.post('/notify/overdue-tasks-batch', async (req: Request, res: Response) => {
  try {
    const { assigneeEmail } = req.body;
    
    if (!assigneeEmail) {
      return res.status(400).json({ error: 'assigneeEmail is required' });
    }
    
    // Get all tasks
    const tasks = await storage.getTasks();
    
    // Filter for overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date() && task.status !== 'completed';
    });
    
    if (overdueTasks.length === 0) {
      return res.status(200).json({ 
        message: 'No overdue tasks found',
        tasksProcessed: 0 
      });
    }
    
    const results = await Promise.all(
      overdueTasks.map(async (task) => {
        if (!task.claimId) return { taskId: task.id, success: false, error: 'No claim associated with task' };
        
        const claim = await storage.getClaim(task.claimId);
        if (!claim) return { taskId: task.id, success: false, error: 'Related claim not found' };
        
        const success = await EmailService.sendOverdueTaskNotification(task, claim, assigneeEmail);
        
        if (success) {
          // Record this activity
          await storage.createActivity({
            claimId: claim.id,
            type: 'notification',
            description: `Overdue task notification sent to ${assigneeEmail} for task: ${task.title}`,
            createdBy: req.body.createdBy || 'system'
          });
        }
        
        return { 
          taskId: task.id, 
          success, 
          claimNumber: claim.claimNumber,
          title: task.title,
          dueDate: task.dueDate
        };
      })
    );
    
    const successfulNotifications = results.filter(r => r.success);
    const failedNotifications = results.filter(r => !r.success);
    
    return res.status(200).json({
      message: `Processed ${results.length} overdue tasks`,
      successful: successfulNotifications.length,
      failed: failedNotifications.length,
      successfulTasks: successfulNotifications,
      failedTasks: failedNotifications
    });
  } catch (error) {
    console.error('Error processing overdue tasks batch:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Test connection to Postmark API
 */
router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    // Use a simple test email to verify API connectivity
    const success = await EmailService.sendEmail({
      to: req.body.testEmail || process.env.POSTMARK_FROM_EMAIL,
      subject: 'Test Connection to Postmark API',
      htmlBody: '<html><body><h1>Connection Test</h1><p>This is a test email to verify connectivity to the Postmark API.</p></body></html>',
      tag: 'test-connection'
    });
    
    if (success) {
      return res.status(200).json({ message: 'Postmark API connection successful' });
    } else {
      return res.status(500).json({ error: 'Failed to connect to Postmark API' });
    }
  } catch (error) {
    console.error('Error testing Postmark connection:', error);
    return res.status(500).json({ error: 'Connection test failed', details: error });
  }
});

export default router;