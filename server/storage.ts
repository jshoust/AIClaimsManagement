import { 
  users, User, InsertUser, 
  claims, Claim, InsertClaim,
  tasks, Task, InsertTask,
  activities, Activity, InsertActivity,
  documents, Document, InsertDocument,
  emailTemplates, EmailTemplate, InsertEmailTemplate,
  stateLaws, StateLaw, InsertStateLaw
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Claim operations
  getClaims(): Promise<Claim[]>;
  getClaim(id: number): Promise<Claim | undefined>;
  getClaimByNumber(claimNumber: string): Promise<Claim | undefined>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: number, claim: Partial<Claim>): Promise<Claim | undefined>;
  
  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByClaim(claimId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByClaim(claimId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Document operations
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByClaim(claimId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  
  // Email template operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  
  // State law operations
  getStateLaws(): Promise<StateLaw[]>;
  getStateLaw(id: number): Promise<StateLaw | undefined>;
  getStateLawByState(state: string): Promise<StateLaw | undefined>;
  createStateLaw(law: InsertStateLaw): Promise<StateLaw>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private claims: Map<number, Claim>;
  private tasks: Map<number, Task>;
  private activities: Map<number, Activity>;
  private documents: Map<number, Document>;
  private emailTemplates: Map<number, EmailTemplate>;
  private stateLaws: Map<number, StateLaw>;
  
  private userCurrentId: number;
  private claimCurrentId: number;
  private taskCurrentId: number;
  private activityCurrentId: number;
  private documentCurrentId: number;
  private emailTemplateCurrentId: number;
  private stateLawCurrentId: number;

  constructor() {
    this.users = new Map();
    this.claims = new Map();
    this.tasks = new Map();
    this.activities = new Map();
    this.documents = new Map();
    this.emailTemplates = new Map();
    this.stateLaws = new Map();
    
    this.userCurrentId = 1;
    this.claimCurrentId = 1;
    this.taskCurrentId = 1;
    this.activityCurrentId = 1;
    this.documentCurrentId = 1;
    this.emailTemplateCurrentId = 1;
    this.stateLawCurrentId = 1;
    
    // Initialize with demo data
    this.initializeDemoData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Claim operations
  async getClaims(): Promise<Claim[]> {
    return Array.from(this.claims.values());
  }
  
  async getClaim(id: number): Promise<Claim | undefined> {
    return this.claims.get(id);
  }
  
  async getClaimByNumber(claimNumber: string): Promise<Claim | undefined> {
    return Array.from(this.claims.values()).find(
      (claim) => claim.claimNumber === claimNumber,
    );
  }
  
  async createClaim(insertClaim: InsertClaim): Promise<Claim> {
    const id = this.claimCurrentId++;
    const claimNumber = `CLM-${10000 + id}`;
    const claim: Claim = { 
      ...insertClaim, 
      id, 
      claimNumber,
      dateSubmitted: new Date()
    };
    this.claims.set(id, claim);
    return claim;
  }
  
  async updateClaim(id: number, updatedFields: Partial<Claim>): Promise<Claim | undefined> {
    const claim = this.claims.get(id);
    if (!claim) return undefined;
    
    const updatedClaim = { ...claim, ...updatedFields };
    this.claims.set(id, updatedClaim);
    return updatedClaim;
  }
  
  // Task operations
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByClaim(claimId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.claimId === claimId,
    );
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskCurrentId++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, updatedFields: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updatedFields };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }
  
  async getActivitiesByClaim(claimId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.claimId === claimId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityCurrentId++;
    const activity: Activity = { 
      ...insertActivity, 
      id,
      timestamp: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  // Document operations
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getDocumentsByClaim(claimId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.claimId === claimId,
    );
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentCurrentId++;
    const document: Document = { 
      ...insertDocument, 
      id,
      uploadedAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }
  
  async updateDocument(id: number, updatedFields: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updatedFields };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  // Email template operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values());
  }
  
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }
  
  async getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined> {
    return Array.from(this.emailTemplates.values()).find(
      (template) => template.name === name,
    );
  }
  
  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.emailTemplateCurrentId++;
    const template: EmailTemplate = { ...insertTemplate, id };
    this.emailTemplates.set(id, template);
    return template;
  }
  
  // State law operations
  async getStateLaws(): Promise<StateLaw[]> {
    return Array.from(this.stateLaws.values());
  }
  
  async getStateLaw(id: number): Promise<StateLaw | undefined> {
    return this.stateLaws.get(id);
  }
  
  async getStateLawByState(state: string): Promise<StateLaw | undefined> {
    return Array.from(this.stateLaws.values()).find(
      (law) => law.state === state,
    );
  }
  
  async createStateLaw(insertLaw: InsertStateLaw): Promise<StateLaw> {
    const id = this.stateLawCurrentId++;
    const law: StateLaw = { ...insertLaw, id };
    this.stateLaws.set(id, law);
    return law;
  }
  
  // Initialize with demo data
  private initializeDemoData() {
    // Create demo user
    this.createUser({
      username: "admin",
      password: "password",
      fullName: "John Doe",
      email: "admin@example.com",
      role: "admin"
    });
    
    // Create demo email templates
    this.createEmailTemplate({
      name: "Missing Information Request",
      subject: "Missing Information for Claim #{claimNumber}",
      body: "Dear {contactPerson},\n\nWe are processing your claim #{claimNumber} but need additional information to proceed. Please provide the following:\n\n{missingItems}\n\nThank you,\nWard TLC Claims Department",
      isDefault: true
    });
    
    this.createEmailTemplate({
      name: "Claim Status Update",
      subject: "Status Update for Claim #{claimNumber}",
      body: "Dear {contactPerson},\n\nYour claim #{claimNumber} status has been updated to {status}.\n\nThank you,\nWard TLC Claims Department",
      isDefault: false
    });
    
    // Create demo state laws
    this.createStateLaw({
      state: "California",
      description: "California Freight Claims Regulations",
      lawReference: "CA Commercial Code § 7101-7603",
      details: "California follows the federal Carmack Amendment regulations but adds additional consumer protections for in-state shipments."
    });
    
    this.createStateLaw({
      state: "New York",
      description: "New York Freight Claims Regulations",
      lawReference: "NY UCC § 7-101 to 7-603",
      details: "New York State regulations for interstate and intrastate shipping claims within New York jurisdiction."
    });
    
    // Create demo claims
    const claim1 = this.createClaim({
      claimNumber: "CLM-1082",
      customerName: "Acme Logistics Inc.",
      contactPerson: "John Smith",
      email: "john.smith@acmelogistics.com",
      phone: "(555) 123-4567",
      orderNumber: "ORD-29384",
      claimAmount: "$1,250.00",
      claimType: "Damaged Goods",
      description: "Shipment arrived with visible damage to outer packaging and contents",
      status: "missing_info",
      assignedTo: "Sarah Johnson",
      missingInformation: ["Photos of damaged items", "Original packing list", "Delivery receipt signature"]
    });
    
    this.createClaim({
      claimNumber: "CLM-1081",
      customerName: "Global Shipping Co.",
      contactPerson: "Mark Davis",
      email: "mark.davis@globalshipping.com",
      phone: "(555) 234-5678",
      orderNumber: "ORD-29385",
      claimAmount: "$950.00",
      claimType: "Lost Shipment",
      description: "Shipment never arrived at destination",
      status: "in_review",
      assignedTo: "Mike Thompson",
      missingInformation: []
    });
    
    this.createClaim({
      claimNumber: "CLM-1080",
      customerName: "FastTrack Delivery",
      contactPerson: "Lisa Johnson",
      email: "lisa.johnson@fasttrack.com",
      phone: "(555) 345-6789",
      orderNumber: "ORD-29386",
      claimAmount: "$2,300.00",
      claimType: "Shortage",
      description: "Shipment arrived with 3 items missing from the inventory list",
      status: "follow_up",
      assignedTo: "David Brown",
      missingInformation: []
    });
    
    this.createClaim({
      claimNumber: "CLM-1079",
      customerName: "Metro Distribution",
      contactPerson: "Robert Chen",
      email: "robert.chen@metrodist.com",
      phone: "(555) 456-7890",
      orderNumber: "ORD-29387",
      claimAmount: "$1,750.00",
      claimType: "Damaged Goods",
      description: "Multiple items damaged during transit",
      status: "completed",
      assignedTo: "Jessica Williams",
      missingInformation: []
    });
    
    this.createClaim({
      claimNumber: "CLM-1078",
      customerName: "Rapid Freight Services",
      contactPerson: "Emily Taylor",
      email: "emily.taylor@rapidfreight.com",
      phone: "(555) 567-8901",
      orderNumber: "ORD-29388",
      claimAmount: "$3,200.00",
      claimType: "Delivery Delay",
      description: "Shipment delivered 5 days late causing business interruption",
      status: "completed",
      assignedTo: "Sarah Johnson",
      missingInformation: []
    });
    
    // Create demo tasks
    this.createTask({
      title: "Follow up on missing documentation",
      description: "Contact customer to request the missing photos and delivery receipt",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      claimId: 1,
      status: "pending",
      assignedTo: "Sarah Johnson"
    });
    
    this.createTask({
      title: "Send claims data request email",
      description: "Email customer requesting additional information about the lost items",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      claimId: 3,
      status: "pending",
      assignedTo: "David Brown"
    });
    
    this.createTask({
      title: "Review state law applicability",
      description: "Check which state laws apply to this interstate shipment",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // in 3 days
      claimId: 2,
      status: "pending",
      assignedTo: "Mike Thompson"
    });
    
    this.createTask({
      title: "Compile claims documentation packet",
      description: "Collect all documents and create claims packet for processing",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // in 4 days
      claimId: 5,
      status: "pending",
      assignedTo: "Sarah Johnson"
    });
    
    // Create demo activities
    this.createActivity({
      claimId: 1,
      type: "email",
      description: "Email Sent: Missing Information Request",
      createdBy: "Sarah Johnson",
      metadata: {
        details: "Sent email to Acme Logistics requesting missing shipment details for claim #CLM-1082."
      }
    });
    
    this.createActivity({
      claimId: 2,
      type: "phone",
      description: "Phone Call: Claim Information",
      createdBy: "Mike Thompson",
      metadata: {
        details: "Called Global Shipping to discuss claim details and requirements for #CLM-1081."
      }
    });
    
    this.createActivity({
      claimId: 3,
      type: "document",
      description: "Document: Claim Form Received",
      createdBy: "David Brown",
      metadata: {
        details: "Received completed claim form from FastTrack Delivery for claim #CLM-1080."
      }
    });
    
    this.createActivity({
      claimId: 4,
      type: "status_update",
      description: "Status Update: Claim Finalized",
      createdBy: "Jessica Williams",
      metadata: {
        details: "Claim #CLM-1079 for Metro Distribution has been finalized and approved.",
        oldStatus: "in_review",
        newStatus: "completed"
      }
    });
  }
}

export const storage = new MemStorage();
