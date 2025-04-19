import { ServerClient } from 'postmark';
import { Claim, Task, Activity, Document } from '@shared/schema';

// Initialize the Postmark client with API key
const client = new ServerClient(process.env.POSTMARK_API_KEY || '');
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || '';

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  tag?: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
  attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
    ContentID?: string;
  }>;
}

/**
 * Send an email using Postmark
 */
export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
  tag,
  replyTo,
  cc,
  bcc,
  attachments
}: SendEmailOptions): Promise<boolean> {
  try {
    if (!process.env.POSTMARK_API_KEY || !process.env.POSTMARK_FROM_EMAIL) {
      console.error('Postmark API key or sender email not configured');
      return false;
    }

    const response = await client.sendEmail({
      From: FROM_EMAIL,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      Tag: tag,
      ReplyTo: replyTo,
      Cc: cc,
      Bcc: bcc,
      Attachments: attachments
    });

    console.log(`Email sent successfully with message ID: ${response.MessageID}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send claim creation notification
 */
export async function sendClaimCreatedNotification(claim: Claim, recipientEmail: string): Promise<boolean> {
  const subject = `New Claim Created: ${claim.claimNumber}`;
  const htmlBody = `
    <html>
      <body>
        <h1>New Claim Created</h1>
        <p>A new claim has been created in the system with the following details:</p>
        <table border="0" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Claim Number</th>
            <td style="border: 1px solid #ddd;">${claim.claimNumber}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Date Created</th>
            <td style="border: 1px solid #ddd;">${new Date(claim.dateSubmitted).toLocaleDateString()}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Status</th>
            <td style="border: 1px solid #ddd;">${claim.status}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Ward PRO Number</th>
            <td style="border: 1px solid #ddd;">${claim.wardProNumber || 'N/A'}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Description</th>
            <td style="border: 1px solid #ddd;">${claim.claimDescription || 'N/A'}</td>
          </tr>
        </table>
        <p>Please log in to the claims management system to view the full details.</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    htmlBody,
    tag: 'claim-created',
  });
}

/**
 * Send claim status update notification
 */
export async function sendClaimStatusUpdateNotification(
  claim: Claim, 
  oldStatus: string, 
  recipientEmail: string
): Promise<boolean> {
  const subject = `Claim Status Updated: ${claim.claimNumber}`;
  const htmlBody = `
    <html>
      <body>
        <h1>Claim Status Updated</h1>
        <p>The status of claim ${claim.claimNumber} has been updated:</p>
        <table border="0" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Claim Number</th>
            <td style="border: 1px solid #ddd;">${claim.claimNumber}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Previous Status</th>
            <td style="border: 1px solid #ddd;">${oldStatus}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">New Status</th>
            <td style="border: 1px solid #ddd;">${claim.status}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Last Updated</th>
            <td style="border: 1px solid #ddd;">${new Date(claim.dateSubmitted).toLocaleString()}</td>
          </tr>
        </table>
        <p>Please log in to the claims management system to view the full details.</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    htmlBody,
    tag: 'claim-status-update',
  });
}

/**
 * Send task assignment notification
 */
export async function sendTaskAssignmentNotification(
  task: Task,
  claim: Claim,
  assigneeEmail: string
): Promise<boolean> {
  const subject = `New Task Assigned: ${task.title}`;
  const htmlBody = `
    <html>
      <body>
        <h1>New Task Assigned</h1>
        <p>You have been assigned a new task:</p>
        <table border="0" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Task Title</th>
            <td style="border: 1px solid #ddd;">${task.title}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Description</th>
            <td style="border: 1px solid #ddd;">${task.description || 'N/A'}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Due Date</th>
            <td style="border: 1px solid #ddd;">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Status</th>
            <td style="border: 1px solid #ddd;">${task.status}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Related Claim</th>
            <td style="border: 1px solid #ddd;">${claim.claimNumber}</td>
          </tr>
        </table>
        <p>Please log in to the claims management system to view and update this task.</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: assigneeEmail,
    subject,
    htmlBody,
    tag: 'task-assignment',
  });
}

/**
 * Send document upload notification
 */
export async function sendDocumentUploadNotification(
  document: Document,
  claim: Claim,
  recipientEmail: string
): Promise<boolean> {
  const subject = `New Document Uploaded: ${document.fileName}`;
  const htmlBody = `
    <html>
      <body>
        <h1>New Document Uploaded</h1>
        <p>A new document has been uploaded for claim ${claim.claimNumber}:</p>
        <table border="0" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Document Name</th>
            <td style="border: 1px solid #ddd;">${document.fileName}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Document Type</th>
            <td style="border: 1px solid #ddd;">${document.fileType || 'Not specified'}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Upload Date</th>
            <td style="border: 1px solid #ddd;">${new Date(document.uploadedAt).toLocaleString()}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Related Claim</th>
            <td style="border: 1px solid #ddd;">${claim.claimNumber}</td>
          </tr>
        </table>
        <p>Please log in to the claims management system to view this document.</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    htmlBody,
    tag: 'document-upload',
  });
}

/**
 * Send overdue task notification
 */
export async function sendOverdueTaskNotification(
  task: Task,
  claim: Claim,
  recipientEmail: string
): Promise<boolean> {
  const subject = `OVERDUE Task: ${task.title} for Claim ${claim.claimNumber}`;
  const daysOverdue = task.dueDate ? 
    Math.ceil((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 3600 * 24)) : 
    0;
  
  const htmlBody = `
    <html>
      <body>
        <h1 style="color: #D32F2F;">Overdue Task Alert</h1>
        <p>The following task is <strong>${daysOverdue} days overdue</strong>:</p>
        <table border="0" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Task Title</th>
            <td style="border: 1px solid #ddd;">${task.title}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Description</th>
            <td style="border: 1px solid #ddd;">${task.description || 'N/A'}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Due Date</th>
            <td style="border: 1px solid #ddd; color: #D32F2F; font-weight: bold;">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Status</th>
            <td style="border: 1px solid #ddd;">${task.status}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Related Claim</th>
            <td style="border: 1px solid #ddd;">${claim.claimNumber}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">Please log in to the claims management system to update this task as soon as possible.</p>
        <div style="margin-top: 15px; padding: 10px; background-color: #FFEBEE; border-left: 4px solid #D32F2F;">
          <p style="margin: 0;">Overdue tasks may cause delays in claim processing and affect customer satisfaction.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    htmlBody,
    tag: 'overdue-task',
  });
}

/**
 * Send weekly claim summary report
 */
export async function sendWeeklyClaimSummary(
  claims: Claim[],
  tasks: Task[],
  recipientEmail: string
): Promise<boolean> {
  const pendingClaims = claims.filter(claim => claim.status !== 'completed' && claim.status !== 'closed');
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== 'completed';
  });

  const subject = 'Weekly Claims Management Summary';
  const htmlBody = `
    <html>
      <body>
        <h1>Weekly Claims Management Summary</h1>
        <h2>Summary Statistics</h2>
        <table border="0" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse; width: 100%;">
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Total Active Claims</th>
            <td style="border: 1px solid #ddd;">${pendingClaims.length}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Overdue Tasks</th>
            <td style="border: 1px solid #ddd;">${overdueTasks.length}</td>
          </tr>
          <tr>
            <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Claims Requiring Action</th>
            <td style="border: 1px solid #ddd;">${claims.filter(c => c.status === 'pending' || c.status === 'missing-info').length}</td>
          </tr>
        </table>

        ${
          pendingClaims.length > 0 
          ? `
            <h2>Active Claims</h2>
            <table border="0" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse; width: 100%;">
              <tr>
                <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Claim Number</th>
                <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Status</th>
                <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Created Date</th>
                <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Last Updated</th>
              </tr>
              ${pendingClaims.map(claim => `
                <tr>
                  <td style="border: 1px solid #ddd;">${claim.claimNumber}</td>
                  <td style="border: 1px solid #ddd;">${claim.status}</td>
                  <td style="border: 1px solid #ddd;">${new Date(claim.dateSubmitted).toLocaleDateString()}</td>
                  <td style="border: 1px solid #ddd;">${new Date(claim.dateSubmitted).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </table>
          `
          : ''
        }

        ${
          overdueTasks.length > 0
          ? `
            <h2>Overdue Tasks</h2>
            <table border="0" cellpadding="5" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse; width: 100%;">
              <tr>
                <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Task Title</th>
                <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Due Date</th>
                <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Priority</th>
                <th style="text-align: left; background-color: #f2f2f2; border: 1px solid #ddd;">Claim Number</th>
              </tr>
              ${overdueTasks.map(task => `
                <tr>
                  <td style="border: 1px solid #ddd;">${task.title}</td>
                  <td style="border: 1px solid #ddd;">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</td>
                  <td style="border: 1px solid #ddd;">Normal</td>
                  <td style="border: 1px solid #ddd;">${task.claimId}</td>
                </tr>
              `).join('')}
            </table>
          `
          : ''
        }
        <p>Please log in to the claims management system to view full details and take necessary actions.</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    htmlBody,
    tag: 'weekly-summary',
  });
}

/**
 * Send generic email with template
 */
export async function sendTemplatedEmail(
  templateName: string,
  recipientEmail: string,
  templateData: Record<string, any>
): Promise<boolean> {
  try {
    // You could use Postmark's template engine here
    // For simplicity, we're manually constructing the email based on the template name
    let subject = '';
    let htmlBody = '';

    switch (templateName) {
      case 'missing-information-request':
        subject = `Missing Information Request: Claim ${templateData.claimNumber}`;
        htmlBody = `
          <html>
            <body>
              <h1>Missing Information Request</h1>
              <p>Dear ${templateData.recipientName || 'Valued Customer'},</p>
              <p>We are processing your claim ${templateData.claimNumber} and require some additional information:</p>
              <ul>
                ${templateData.missingItems.map((item: string) => `<li>${item}</li>`).join('')}
              </ul>
              <p>Please provide this information at your earliest convenience to prevent delays in processing your claim.</p>
              <p>Thank you for your cooperation.</p>
            </body>
          </html>
        `;
        break;

      case 'claim-approval':
        subject = `Claim Approved: ${templateData.claimNumber}`;
        htmlBody = `
          <html>
            <body>
              <h1>Claim Approved</h1>
              <p>Dear ${templateData.recipientName || 'Valued Customer'},</p>
              <p>We are pleased to inform you that your claim ${templateData.claimNumber} has been approved.</p>
              <p>Approval details:</p>
              <ul>
                <li>Approved amount: ${templateData.approvedAmount || 'N/A'}</li>
                <li>Date of approval: ${templateData.approvalDate || new Date().toLocaleDateString()}</li>
                <li>Payment method: ${templateData.paymentMethod || 'Standard'}</li>
              </ul>
              <p>You should receive payment within 7-10 business days.</p>
              <p>Thank you for your patience throughout this process.</p>
            </body>
          </html>
        `;
        break;

      default:
        subject = templateData.subject || 'Claim Notification';
        htmlBody = `
          <html>
            <body>
              <h1>${templateData.heading || 'Claim Notification'}</h1>
              <p>${templateData.message || 'Please log in to the claims management system for details.'}</p>
            </body>
          </html>
        `;
    }

    return sendEmail({
      to: recipientEmail,
      subject,
      htmlBody,
      tag: templateName,
    });
  } catch (error) {
    console.error('Failed to send templated email:', error);
    return false;
  }
}