import { db } from "./db";
import { 
  users, 
  claims, 
  tasks, 
  activities, 
  emailTemplates,
  stateLaws,
  ClaimStatus,
  ActivityType
} from "@shared/schema";

/**
 * Seeds the database with initial data
 * This should only be run once to initialize the database
 * with sample data for demonstration purposes
 */
export async function seedDatabase() {
  console.log("Checking if database needs seeding...");
  
  // Check if users table is empty
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already has data, skipping seed");
    return;
  }
  
  console.log("Seeding database with initial data...");
  
  try {
    // Create demo user
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      password: "password",
      fullName: "John Doe",
      email: "admin@example.com",
      role: "admin"
    }).returning();
    
    console.log("Created admin user:", adminUser.id);
    
    // Create demo email templates
    const [template1] = await db.insert(emailTemplates).values({
      name: "Missing Information Request",
      subject: "Missing Information for Claim #{claimNumber}",
      body: "Dear {contactPerson},\n\nWe are processing your claim #{claimNumber} but need additional information to proceed. Please provide the following:\n\n{missingItems}\n\nThank you,\nWard TLC Claims Department",
      isDefault: true
    }).returning();
    
    const [template2] = await db.insert(emailTemplates).values({
      name: "Claim Status Update",
      subject: "Status Update for Claim #{claimNumber}",
      body: "Dear {contactPerson},\n\nYour claim #{claimNumber} status has been updated to {status}.\n\nThank you,\nWard TLC Claims Department",
      isDefault: false
    }).returning();
    
    console.log("Created email templates:", template1.id, template2.id);
    
    // Create demo state laws
    const [law1] = await db.insert(stateLaws).values({
      state: "California",
      description: "California Freight Claims Regulations",
      lawReference: "CA Commercial Code § 7101-7603",
      details: "California follows the federal Carmack Amendment regulations but adds additional consumer protections for in-state shipments."
    }).returning();
    
    const [law2] = await db.insert(stateLaws).values({
      state: "New York",
      description: "New York Freight Claims Regulations",
      lawReference: "NY UCC § 7-101 to 7-603",
      details: "New York State regulations for interstate and intrastate shipping claims within New York jurisdiction."
    }).returning();
    
    console.log("Created state laws:", law1.id, law2.id);
    
    // Create demo claims
    const [claim1] = await db.insert(claims).values({
      claimNumber: "CLM-10001",
      companyName: "Acme Logistics Inc.",
      contactPerson: "John Smith",
      email: "john.smith@acmelogistics.com",
      phone: "(555) 123-4567",
      claimAmount: "$1,250.00",
      claimType: "damage",
      claimDescription: "Shipment arrived with visible damage to outer packaging and contents",
      status: ClaimStatus.MISSING_INFO,
      assignedTo: "Sarah Johnson",
      missingInformation: ["Photos of damaged items", "Original packing list", "Delivery receipt signature"],
      dateSubmitted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    }).returning();
    
    const [claim2] = await db.insert(claims).values({
      claimNumber: "CLM-10002",
      companyName: "Global Shipping Co.",
      contactPerson: "Mark Davis",
      email: "mark.davis@globalshipping.com",
      phone: "(555) 234-5678",
      claimAmount: "$950.00",
      claimType: "shortage",
      claimDescription: "Shipment never arrived at destination",
      status: ClaimStatus.IN_REVIEW,
      assignedTo: "Mike Thompson",
      missingInformation: [],
      dateSubmitted: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
    }).returning();
    
    const [claim3] = await db.insert(claims).values({
      claimNumber: "CLM-10003",
      companyName: "FastTrack Delivery",
      contactPerson: "Lisa Johnson",
      email: "lisa.johnson@fasttrack.com",
      phone: "(555) 345-6789",
      claimAmount: "$2,300.00",
      claimType: "shortage",
      claimDescription: "Shipment arrived with 3 items missing from the inventory list",
      status: ClaimStatus.FOLLOW_UP,
      assignedTo: "David Brown",
      missingInformation: [],
      dateSubmitted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    }).returning();
    
    const [claim4] = await db.insert(claims).values({
      claimNumber: "CLM-10004",
      companyName: "Metro Distribution",
      contactPerson: "Robert Chen",
      email: "robert.chen@metrodist.com",
      phone: "(555) 456-7890",
      claimAmount: "$1,750.00",
      claimType: "damage",
      claimDescription: "Multiple items damaged during transit",
      status: ClaimStatus.COMPLETED,
      assignedTo: "Jessica Williams",
      missingInformation: [],
      dateSubmitted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }).returning();
    
    const [claim5] = await db.insert(claims).values({
      claimNumber: "CLM-10005",
      companyName: "Rapid Freight Services",
      contactPerson: "Emily Taylor",
      email: "emily.taylor@rapidfreight.com",
      phone: "(555) 567-8901",
      claimAmount: "$3,200.00",
      claimType: "damage",
      claimDescription: "Shipment delivered 5 days late causing business interruption",
      status: ClaimStatus.COMPLETED,
      assignedTo: "Sarah Johnson",
      missingInformation: [],
      dateSubmitted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    }).returning();
    
    console.log("Created claims:", claim1.id, claim2.id, claim3.id, claim4.id, claim5.id);
    
    // Create demo tasks
    const [task1] = await db.insert(tasks).values({
      title: "Follow up on missing documentation",
      description: "Contact customer to request the missing photos and delivery receipt",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
      claimId: claim1.id,
      status: "pending",
      assignedTo: "Sarah Johnson"
    }).returning();
    
    const [task2] = await db.insert(tasks).values({
      title: "Send claims data request email",
      description: "Email customer requesting additional information about the lost items",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // in 2 days
      claimId: claim3.id,
      status: "pending",
      assignedTo: "David Brown"
    }).returning();
    
    const [task3] = await db.insert(tasks).values({
      title: "Review state law applicability",
      description: "Check which state laws apply to this interstate shipment",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // in 3 days
      claimId: claim2.id,
      status: "pending",
      assignedTo: "Mike Thompson"
    }).returning();
    
    const [task4] = await db.insert(tasks).values({
      title: "Compile claims documentation packet",
      description: "Collect all documents and create claims packet for processing",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // in 4 days
      claimId: claim5.id,
      status: "pending",
      assignedTo: "Sarah Johnson"
    }).returning();
    
    console.log("Created tasks:", task1.id, task2.id, task3.id, task4.id);
    
    // Create demo activities
    const [activity1] = await db.insert(activities).values({
      claimId: claim1.id,
      type: ActivityType.EMAIL,
      description: "Email Sent: Missing Information Request",
      createdBy: "Sarah Johnson",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      metadata: {
        details: "Sent email to Acme Logistics requesting missing shipment details for claim #CLM-10001."
      }
    }).returning();
    
    const [activity2] = await db.insert(activities).values({
      claimId: claim2.id,
      type: ActivityType.PHONE,
      description: "Phone Call: Claim Information",
      createdBy: "Mike Thompson",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      metadata: {
        details: "Called Global Shipping to discuss claim details and requirements for #CLM-10002."
      }
    }).returning();
    
    const [activity3] = await db.insert(activities).values({
      claimId: claim3.id,
      type: ActivityType.DOCUMENT,
      description: "Document: Claim Form Received",
      createdBy: "David Brown",
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
      metadata: {
        details: "Received completed claim form from FastTrack Delivery for claim #CLM-10003."
      }
    }).returning();
    
    const [activity4] = await db.insert(activities).values({
      claimId: claim4.id,
      type: ActivityType.STATUS_UPDATE,
      description: "Status Update: Claim Finalized",
      createdBy: "Jessica Williams",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      metadata: {
        details: "Claim #CLM-10004 for Metro Distribution has been finalized and approved.",
        oldStatus: "in_review",
        newStatus: "completed"
      }
    }).returning();
    
    console.log("Created activities:", activity1.id, activity2.id, activity3.id, activity4.id);
    
    console.log("Database seeding completed successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
}