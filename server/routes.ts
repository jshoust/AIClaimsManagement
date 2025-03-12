import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClaimSchema, insertTaskSchema, insertActivitySchema, insertDocumentSchema, ActivityType } from "@shared/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";
import { analyzePDFDocument, DocumentAnalysisResult } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  const apiRouter = app.route('/api');
  
  // Claims routes
  app.get('/api/claims', async (req: Request, res: Response) => {
    try {
      const claims = await storage.getClaims();
      res.json(claims);
    } catch (error) {
      console.error('Error fetching claims:', error);
      res.status(500).json({ message: "Failed to fetch claims", error: error.message });
    }
  });
  
  app.get('/api/claims/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const claim = await storage.getClaim(id);
      
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      res.json(claim);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });
  
  app.post('/api/claims', async (req: Request, res: Response) => {
    try {
      const validatedData = insertClaimSchema.parse(req.body);
      const claim = await storage.createClaim(validatedData);
      
      // Create activity for the new claim
      await storage.createActivity({
        claimId: claim.id,
        type: "status_update",
        description: "Claim Created",
        createdBy: claim.assignedTo || "System",
        metadata: {
          details: `New claim #${claim.claimNumber} created for ${claim.customerName}`
        }
      });
      
      res.status(201).json(claim);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid claim data", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Failed to create claim" });
    }
  });
  
  app.patch('/api/claims/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const claim = await storage.getClaim(id);
      
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }

      // Update the missingInformation field based on filled fields
      const updateData = { ...req.body };
      if (claim.missingInformation && Array.isArray(claim.missingInformation) && claim.missingInformation.length > 0) {
        // Map of field names to missing information text
        const fieldToMissingInfoMap: Record<string, string[]> = {
          'wardProNumber': ['Ward Pro Number'],
          'claimantsRefNumber': ['Claimant\'s Reference Number'],
          'freightBillDate': ['Freight Bill Date'],
          'claimAmount': ['Claim Amount'],
          'shipperName': ['Shipper Name', 'Shipper Details'],
          'shipperAddress': ['Shipper Address', 'Shipper Details'],
          'shipperPhone': ['Shipper Phone', 'Shipper Details'],
          'consigneeName': ['Consignee Name', 'Consignee Details'],
          'consigneeAddress': ['Consignee Address', 'Consignee Details'],
          'consigneePhone': ['Consignee Phone', 'Consignee Details'],
          'claimDescription': ['Claim Description'],
          'companyName': ['Company Name'],
          'contactPerson': ['Contact Person'],
          'email': ['Email Address'],
          'phone': ['Phone Number'],
        };

        // Get a list of fields that are being updated with non-empty values
        const updatedFields = Object.keys(req.body).filter(key => 
          req.body[key] !== null && 
          req.body[key] !== undefined && 
          req.body[key] !== ''
        );

        // For each updated field, remove corresponding missing info items
        let missingInfo = [...claim.missingInformation] as string[];
        let removedItems: string[] = [];

        updatedFields.forEach(field => {
          if (fieldToMissingInfoMap[field]) {
            fieldToMissingInfoMap[field].forEach(infoText => {
              const index = missingInfo.findIndex(item => 
                item.toLowerCase().includes(infoText.toLowerCase())
              );
              if (index !== -1) {
                removedItems.push(missingInfo[index]);
                missingInfo.splice(index, 1);
              }
            });
          }
        });

        // If we removed any items, update the missingInformation field
        if (removedItems.length > 0) {
          updateData.missingInformation = missingInfo;

          // Create activity for removed missing information
          await storage.createActivity({
            claimId: id,
            type: "update",
            description: `Missing Information Updated`,
            createdBy: req.body.assignedTo || claim.assignedTo || "System",
            metadata: {
              details: `Information provided: ${removedItems.join(', ')}`,
              removed: removedItems,
              remaining: missingInfo
            }
          });
        }
      }
      
      const updatedClaim = await storage.updateClaim(id, updateData);
      
      // Create activity for status update if status changed
      if (req.body.status && req.body.status !== claim.status) {
        await storage.createActivity({
          claimId: id,
          type: "status_update",
          description: `Status Update: ${req.body.status}`,
          createdBy: req.body.assignedTo || claim.assignedTo || "System",
          metadata: {
            details: `Claim #${claim.claimNumber} status updated from ${claim.status} to ${req.body.status}`,
            oldStatus: claim.status,
            newStatus: req.body.status
          }
        });
      }
      
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ message: "Failed to update claim" });
    }
  });
  
  // Tasks routes
  app.get('/api/tasks', async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
    }
  });
  
  app.get('/api/claims/:claimId/tasks', async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.claimId);
      const tasks = await storage.getTasksByClaim(claimId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks for claim" });
    }
  });
  
  app.post('/api/tasks', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  app.patch('/api/tasks/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const updatedTask = await storage.updateTask(id, req.body);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  
  // Activities routes
  app.get('/api/activities', async (req: Request, res: Response) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });
  
  app.get('/api/claims/:claimId/activities', async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.claimId);
      const activities = await storage.getActivitiesByClaim(claimId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities for claim" });
    }
  });
  
  app.post('/api/activities', async (req: Request, res: Response) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid activity data", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });
  
  // Documents routes
  app.get('/api/documents', async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  
  app.get('/api/claims/:claimId/documents', async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.claimId);
      const documents = await storage.getDocumentsByClaim(claimId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents for claim" });
    }
  });
  
  app.post('/api/documents', async (req: Request, res: Response) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid document data", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });
  
  // Configure multer for file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const storage_config = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      // Create a unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
  
  const upload = multer({ 
    storage: storage_config,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit
    }
  });
  
  // File upload endpoint
  app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const claimId = req.body.claimId ? parseInt(req.body.claimId) : null;
      const uploadedBy = req.body.uploadedBy || "System";
      
      // Create document record in storage
      const document = await storage.createDocument({
        fileName: file.originalname,
        fileType: file.mimetype,
        filePath: file.path,
        claimId,
        uploadedBy
      });
      
      // Analyze the document if it's a PDF
      let analysisResult = null;
      let newClaimId = claimId;
      
      if (file.mimetype === 'application/pdf') {
        try {
          console.log("Processing PDF document:", file.path);
          
          // Process the document with OpenAI
          analysisResult = await analyzePDFDocument(file.path);
          console.log("Analysis result:", JSON.stringify(analysisResult, null, 2));
          
          // If no claim is associated, create a new claim based on analysis
          if (!claimId && analysisResult && analysisResult.extractedData) {
            const extractedData = analysisResult.extractedData;
            
            // Generate a unique claim number
            const claimNumber = `CLM-${Date.now().toString().slice(-8)}`;
            
            // Create the new claim - map the extracted data to our schema fields
            const newClaim = await storage.createClaim({
              claimNumber,
              // Ward form specific fields
              wardProNumber: extractedData.wardProNumber || null,
              todaysDate: extractedData.todaysDate || null,
              freightBillDate: extractedData.freightBillDate || null,
              claimantsRefNumber: extractedData.claimantsRefNumber || null,
              
              // Claim details
              claimAmount: extractedData.claimAmount || '',
              claimType: extractedData.claimType || 'damage',
              
              // Shipper information
              shipperName: extractedData.shipperName || '',
              shipperAddress: extractedData.shipperAddress || '',
              shipperPhone: extractedData.shipperPhone || '',
              
              // Consignee information
              consigneeName: extractedData.consigneeName || '',
              consigneeAddress: extractedData.consigneeAddress || '',
              consigneePhone: extractedData.consigneePhone || '',
              
              // Claim description
              claimDescription: extractedData.claimDescription || `Claim created from document: ${file.originalname}`,
              
              // Supporting documents
              originalBillOfLading: typeof extractedData.originalBillOfLading === 'boolean' ? extractedData.originalBillOfLading : false,
              originalFreightBill: typeof extractedData.originalFreightBill === 'boolean' ? extractedData.originalFreightBill : false,
              originalInvoice: typeof extractedData.originalInvoice === 'boolean' ? extractedData.originalInvoice : false,
              
              // Additional information
              isRepairable: extractedData.isRepairable || '',
              repairCost: extractedData.repairCost || '',
              
              // Claimant information
              companyName: extractedData.companyName || 'Ward Trucking Corp',
              address: extractedData.address || '',
              contactPerson: extractedData.contactPerson || '',
              email: extractedData.email || '',
              phone: extractedData.phone || '',
              fax: extractedData.fax || '',
              
              // System fields
              status: 'new',
              assignedTo: null,
              missingInformation: analysisResult.missingInformation || [],
              signature: ''
            });
            
            // Update document with the new claim ID
            await storage.updateDocument(document.id, { claimId: newClaim.id });
            document.claimId = newClaim.id;
            newClaimId = newClaim.id;
            
            // Create claim creation activity
            await storage.createActivity({
              claimId: newClaim.id,
              type: "status_update",
              description: "New Claim Created from Document",
              createdBy: "Boon AI",
              metadata: {
                documentId: document.id,
                fileName: file.originalname,
                details: `Claim created automatically from uploaded document`
              }
            });
          }
        } catch (analysisError) {
          console.error("Error analyzing document:", analysisError);
        }
      }
      
      // If document is associated with a claim (either original or newly created), create an activity record
      if (newClaimId) {
        await storage.createActivity({
          claimId: newClaimId,
          type: ActivityType.DOCUMENT,
          description: `Document Uploaded: ${file.originalname}`,
          createdBy: uploadedBy,
          metadata: {
            documentId: document.id,
            fileName: file.originalname,
            fileType: file.mimetype,
            details: `Document uploaded by ${uploadedBy}`
          }
        });
        
        // Process any missing information if we have analysis results
        if (analysisResult && analysisResult.missingInformation && analysisResult.missingInformation.length > 0) {
          await storage.updateClaim(newClaimId, { 
            missingInformation: analysisResult.missingInformation 
          });
          
          // Create activity for missing information
          await storage.createActivity({
            claimId: newClaimId,
            type: "analysis",
            description: "Document Analysis: Missing Information Found",
            createdBy: "Boon AI",
            metadata: {
              documentId: document.id,
              missingInformation: analysisResult.missingInformation,
              details: `Boon AI identified missing information in document: ${analysisResult.missingInformation.join(', ')}`
            }
          });
          
          // Automatically create tasks for each missing information item
          for (const missingItem of analysisResult.missingInformation) {
            await storage.createTask({
              title: `Follow up: ${missingItem}`,
              description: `Follow up with the customer to collect the missing information: ${missingItem}`,
              claimId: newClaimId,
              assignedTo: null, // Unassigned by default
              status: 'pending',
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Due in 3 days
              metadata: {
                priority: 'high',
                source: 'automatic',
                documentId: document.id,
                missingInformation: missingItem,
                analysisDate: new Date().toISOString()
              }
            });
          }
        }
        
        // If there are extracted data fields that can be used to update the claim
        if (newClaimId && analysisResult && analysisResult.extractedData) {
          const extractedData = analysisResult.extractedData;
          const updateData: any = {};
          
          // Only update fields that are empty in the claim
          const claim = await storage.getClaim(newClaimId);
          if (claim) {
            // Basic Ward form fields
            if (!claim.wardProNumber && extractedData.wardProNumber) updateData.wardProNumber = extractedData.wardProNumber;
            if (!claim.todaysDate && extractedData.todaysDate) updateData.todaysDate = extractedData.todaysDate;
            if (!claim.freightBillDate && extractedData.freightBillDate) updateData.freightBillDate = extractedData.freightBillDate;
            if (!claim.claimantsRefNumber && extractedData.claimantsRefNumber) updateData.claimantsRefNumber = extractedData.claimantsRefNumber;
            
            // Claim details
            if (!claim.claimAmount && extractedData.claimAmount) updateData.claimAmount = extractedData.claimAmount;
            if (!claim.claimType && extractedData.claimType) updateData.claimType = extractedData.claimType;
            
            // Shipper information
            if (!claim.shipperName && extractedData.shipperName) updateData.shipperName = extractedData.shipperName;
            if (!claim.shipperAddress && extractedData.shipperAddress) updateData.shipperAddress = extractedData.shipperAddress;
            if (!claim.shipperPhone && extractedData.shipperPhone) updateData.shipperPhone = extractedData.shipperPhone;
            
            // Consignee information
            if (!claim.consigneeName && extractedData.consigneeName) updateData.consigneeName = extractedData.consigneeName;
            if (!claim.consigneeAddress && extractedData.consigneeAddress) updateData.consigneeAddress = extractedData.consigneeAddress;
            if (!claim.consigneePhone && extractedData.consigneePhone) updateData.consigneePhone = extractedData.consigneePhone;
            
            // Claimant information
            if (!claim.companyName && extractedData.companyName) updateData.companyName = extractedData.companyName;
            if (!claim.contactPerson && extractedData.contactPerson) updateData.contactPerson = extractedData.contactPerson;
            if (!claim.email && extractedData.email) updateData.email = extractedData.email;
            if (!claim.phone && extractedData.phone) updateData.phone = extractedData.phone;
            
            // Claim description
            if (!claim.claimDescription && extractedData.claimDescription) updateData.claimDescription = extractedData.claimDescription;
            
            // Update claim if there are fields to update
            if (Object.keys(updateData).length > 0) {
              await storage.updateClaim(newClaimId, updateData);
              
              // Create activity for data extraction
              await storage.createActivity({
                claimId: newClaimId,
                type: "analysis",
                description: "Document Analysis: Data Extracted",
                createdBy: "Boon AI",
                metadata: {
                  documentId: document.id,
                  extractedData: updateData,
                  details: `Boon AI extracted and updated claim data from document`
                }
              });
            }
          }
        }
      }
      
      // For UI refreshing, get the claim if one was created
      let createdClaim = null;
      if (newClaimId && newClaimId !== claimId) {  // If a new claim was created
        createdClaim = await storage.getClaim(newClaimId);
      }
      
      // Return both the document, analysis result, and the created claim if available
      if (analysisResult) {
        res.status(201).json({
          document,
          analysisResult,
          claim: createdClaim
        });
      } else {
        res.status(201).json({
          document,
          claim: createdClaim
        });
      }
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });
  
  // Document analysis endpoint for existing documents
  app.post('/api/documents/:id/analyze', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (!document.filePath || !fs.existsSync(document.filePath)) {
        return res.status(400).json({ message: "Document file not found" });
      }
      
      // Only support PDF analysis for now
      if (!document.fileType.includes('pdf')) {
        return res.status(400).json({ message: "Only PDF documents can be analyzed" });
      }
      
      // Process the document with OpenAI
      const analysisResult = await analyzePDFDocument(document.filePath);
      
      // If associated with a claim, update claim with any missing information
      if (document.claimId && analysisResult.missingInformation && analysisResult.missingInformation.length > 0) {
        await storage.updateClaim(document.claimId, { 
          missingInformation: analysisResult.missingInformation 
        });
        
        // Create activity for missing information
        await storage.createActivity({
          claimId: document.claimId,
          type: "analysis",
          description: "Document Analysis: Missing Information Found",
          createdBy: "Boon AI",
          metadata: {
            documentId: document.id,
            missingInformation: analysisResult.missingInformation,
            details: `Boon AI identified missing information in document: ${analysisResult.missingInformation.join(', ')}`
          }
        });
        
        // Automatically create tasks for each missing information item
        for (const missingItem of analysisResult.missingInformation) {
          await storage.createTask({
            title: `Follow up: ${missingItem}`,
            description: `Follow up with the customer to collect the missing information: ${missingItem}`,
            claimId: document.claimId,
            assignedTo: null, // Unassigned by default
            status: 'pending',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Due in 3 days
            metadata: {
              priority: 'high',
              source: 'automatic',
              documentId: document.id,
              missingInformation: missingItem,
              analysisDate: new Date().toISOString()
            }
          });
        }
      }
      
      res.json({
        documentId: document.id,
        fileName: document.fileName,
        analysisResult
      });
    } catch (error) {
      console.error("Document analysis error:", error);
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });
  
  // Email templates routes
  app.get('/api/email-templates', async (req: Request, res: Response) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });
  
  // State laws routes
  app.get('/api/state-laws', async (req: Request, res: Response) => {
    try {
      const laws = await storage.getStateLaws();
      res.json(laws);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch state laws" });
    }
  });
  
  app.get('/api/state-laws/:state', async (req: Request, res: Response) => {
    try {
      const state = req.params.state;
      const law = await storage.getStateLawByState(state);
      
      if (!law) {
        return res.status(404).json({ message: "State law not found" });
      }
      
      res.json(law);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch state law" });
    }
  });

  // Mock email sending endpoint (in a real app, this would connect to a mail service)
  app.post('/api/send-email', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        to: z.string().email(),
        subject: z.string(),
        body: z.string(),
        claimId: z.number().optional()
      });
      
      const { to, subject, body, claimId } = schema.parse(req.body);
      
      // In a real implementation, this would send an actual email
      // For now, we'll just create an activity record
      if (claimId) {
        await storage.createActivity({
          claimId,
          type: "email",
          description: `Email Sent: ${subject}`,
          createdBy: "System",
          metadata: {
            to,
            subject,
            body,
            details: `Email sent to ${to}`
          }
        });
      }
      
      res.json({ message: "Email sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid email data", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Failed to send email" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
