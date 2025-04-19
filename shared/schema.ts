import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
});

// Claims table - Ward Trucking form format
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  claimNumber: text("claim_number").notNull().unique(),
  // Ward Trucking specific fields
  wardProNumber: text("ward_pro_number"),
  todaysDate: text("todays_date"),
  freightBillDate: text("freight_bill_date"),
  claimantsRefNumber: text("claimants_ref_number"),
  claimAmount: text("claim_amount").notNull(),
  claimType: text("claim_type").notNull(), // shortage or damage
  
  // Shipper information
  shipperName: text("shipper_name"), 
  shipperAddress: text("shipper_address"),
  shipperPhone: text("shipper_phone"),
  
  // Consignee information
  consigneeName: text("consignee_name"),
  consigneeAddress: text("consignee_address"),
  consigneePhone: text("consignee_phone"),
  
  // Claim details
  claimDescription: text("claim_description"), // Detailed statement
  
  // Supporting documents
  originalBillOfLading: boolean("original_bill_of_lading").default(false),
  originalFreightBill: boolean("original_freight_bill").default(false),
  originalInvoice: boolean("original_invoice").default(false),
  
  // Additional information
  isRepairable: text("is_repairable"), // Yes/No
  repairCost: text("repair_cost"),
  
  // Claimant information
  companyName: text("company_name").notNull(),
  address: text("address"),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  fax: text("fax"),
  
  // System fields
  status: text("status").notNull().default("new"),
  dateSubmitted: timestamp("date_submitted").notNull().defaultNow(),
  assignedTo: text("assigned_to"),
  missingInformation: jsonb("missing_information").notNull().default([]),
  signature: text("signature"),
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  dateSubmitted: true,
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: date("due_date").notNull(),
  claimId: integer("claim_id").references(() => claims.id),
  status: text("status").notNull().default("pending"),
  assignedTo: text("assigned_to"),
  metadata: jsonb("metadata"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

// Activity table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id),
  type: text("type").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
  metadata: jsonb("metadata"),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  uploadedBy: text("uploaded_by").notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

// Email templates
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
});

// State laws reference
export const stateLaws = pgTable("state_laws", {
  id: serial("id").primaryKey(),
  state: text("state").notNull().unique(),
  description: text("description").notNull(),
  lawReference: text("law_reference").notNull(),
  details: text("details").notNull(),
});

export const insertStateLawSchema = createInsertSchema(stateLaws).omit({
  id: true,
});

// External Databases table
export const externalDatabases = pgTable("external_databases", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull(), // sqlserver, mysql, postgres, oracle
  host: text("host").notNull(),
  port: integer("port").notNull(),
  database: text("database").notNull(),
  schema: text("schema"),
  credentials: text("credentials").notNull(), // JSON string with username, password, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastConnected: timestamp("last_connected"),
  tags: text("tags"), // JSON array of string tags
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").notNull(),
});

export const insertExternalDatabaseSchema = createInsertSchema(externalDatabases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastConnected: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type StateLaw = typeof stateLaws.$inferSelect;
export type InsertStateLaw = z.infer<typeof insertStateLawSchema>;

export type ExternalDatabase = typeof externalDatabases.$inferSelect;
export type InsertExternalDatabase = z.infer<typeof insertExternalDatabaseSchema>;

// Claim status enum
export const ClaimStatus = {
  NEW: "new",
  MISSING_INFO: "missing_info",
  IN_REVIEW: "in_review",
  FOLLOW_UP: "follow_up",
  COMPLETED: "completed",
} as const;

// Activity type enum
export const ActivityType = {
  EMAIL: "email",
  PHONE: "phone",
  DOCUMENT: "document",
  STATUS_UPDATE: "status_update",
} as const;
