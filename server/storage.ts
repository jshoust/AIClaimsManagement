import { 
  users, User, InsertUser, 
  claims, Claim, InsertClaim,
  tasks, Task, InsertTask,
  activities, Activity, InsertActivity,
  documents, Document, InsertDocument,
  emailTemplates, EmailTemplate, InsertEmailTemplate,
  stateLaws, StateLaw, InsertStateLaw,
  ClaimStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, desc } from "drizzle-orm";

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

// PostgreSQL database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Claim operations
  async getClaims(): Promise<Claim[]> {
    return await db.select().from(claims).orderBy(desc(claims.dateSubmitted));
  }
  
  async getClaim(id: number): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }
  
  async getClaimByNumber(claimNumber: string): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.claimNumber, claimNumber));
    return claim;
  }
  
  async createClaim(insertClaim: InsertClaim): Promise<Claim> {
    // Generate a claim number based on the last claim ID + 10000
    const result = await db.select({ max: claims.id }).from(claims);
    const nextId = (result[0]?.max || 0) + 1;
    const claimNumber = `CLM-${10000 + nextId}`;
    
    const [claim] = await db.insert(claims).values({
      ...insertClaim,
      claimNumber,
      dateSubmitted: new Date()
    }).returning();
    
    return claim;
  }
  
  async updateClaim(id: number, updatedFields: Partial<Claim>): Promise<Claim | undefined> {
    const [updatedClaim] = await db
      .update(claims)
      .set(updatedFields)
      .where(eq(claims.id, id))
      .returning();
    
    return updatedClaim;
  }
  
  // Task operations
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(asc(tasks.dueDate));
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async getTasksByClaim(claimId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.claimId, claimId))
      .orderBy(asc(tasks.dueDate));
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }
  
  async updateTask(id: number, updatedFields: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(updatedFields)
      .where(eq(tasks.id, id))
      .returning();
    
    return updatedTask;
  }
  
  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp));
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }
  
  async getActivitiesByClaim(claimId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.claimId, claimId))
      .orderBy(desc(activities.timestamp));
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({
        ...insertActivity,
        timestamp: new Date()
      })
      .returning();
    
    return activity;
  }
  
  // Document operations
  async getDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.uploadedAt));
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }
  
  async getDocumentsByClaim(claimId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.claimId, claimId))
      .orderBy(desc(documents.uploadedAt));
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        ...insertDocument,
        uploadedAt: new Date()
      })
      .returning();
    
    return document;
  }
  
  async updateDocument(id: number, updatedFields: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(updatedFields)
      .where(eq(documents.id, id))
      .returning();
    
    return updatedDocument;
  }
  
  // Email template operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates);
  }
  
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }
  
  async getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name));
    return template;
  }
  
  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await db.insert(emailTemplates).values(insertTemplate).returning();
    return template;
  }
  
  // State law operations
  async getStateLaws(): Promise<StateLaw[]> {
    return await db.select().from(stateLaws);
  }
  
  async getStateLaw(id: number): Promise<StateLaw | undefined> {
    const [law] = await db.select().from(stateLaws).where(eq(stateLaws.id, id));
    return law;
  }
  
  async getStateLawByState(state: string): Promise<StateLaw | undefined> {
    const [law] = await db.select().from(stateLaws).where(eq(stateLaws.state, state));
    return law;
  }
  
  async createStateLaw(insertLaw: InsertStateLaw): Promise<StateLaw> {
    const [law] = await db.insert(stateLaws).values(insertLaw).returning();
    return law;
  }
}

// Initialize the database storage
export const storage = new DatabaseStorage();
