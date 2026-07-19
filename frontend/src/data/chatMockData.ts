import type { Conversation } from "../types/chat";

export const initialConversations: Conversation[] = [
  {
    id: "bike-theft-adamas",
    title: "Bike Theft — Adamas University",
    preview: "I have collected all the required details...",
    updatedAt: "Today, 2:45 PM",
    isComplete: true,
    messages: [
      {
        id: "m1",
        role: "user",
        content: "My bike was stolen yesterday.",
        timestamp: "2:30 PM",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "I'll help you register an FIR. What is your full name?",
        timestamp: "2:30 PM",
      },
      {
        id: "m3",
        role: "user",
        content: "Sanchita Rani Saha",
        timestamp: "2:31 PM",
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "Thank you, Sanchita. What is your mobile number?",
        timestamp: "2:31 PM",
      },
      {
        id: "m5",
        role: "user",
        content: "+91 98765 43210",
        timestamp: "2:32 PM",
      },
      {
        id: "m6",
        role: "assistant",
        content:
          "When exactly did the incident occur? Please provide the date.",
        timestamp: "2:32 PM",
      },
      {
        id: "m7",
        role: "user",
        content: "26 June 2026",
        timestamp: "2:33 PM",
      },
      {
        id: "m8",
        role: "assistant",
        content: "What time did this happen?",
        timestamp: "2:33 PM",
      },
      {
        id: "m9",
        role: "user",
        content: "Around 6:30 PM",
        timestamp: "2:33 PM",
      },
      {
        id: "m10",
        role: "assistant",
        content: "Where did the incident occur?",
        timestamp: "2:34 PM",
      },
      {
        id: "m11",
        role: "user",
        content: "Near Adamas University",
        timestamp: "2:34 PM",
      },
      {
        id: "m12",
        role: "assistant",
        content:
          "Based on your report, this appears to be a case of bicycle theft. Can you confirm the crime type?",
        timestamp: "2:35 PM",
      },
      {
        id: "m13",
        role: "user",
        content: "Yes, theft of my bicycle",
        timestamp: "2:35 PM",
      },
      {
        id: "m14",
        role: "assistant",
        content:
          "Please provide a brief description of the incident — including details about the bicycle and any witnesses.",
        timestamp: "2:36 PM",
      },
      {
        id: "m15",
        role: "user",
        content:
          "It was a black Hero Sprint bicycle parked outside the university gate. I locked it with a U-lock, but when I returned after an hour the lock was cut and the bicycle was gone. No witnesses were present.",
        timestamp: "2:37 PM",
      },
      {
        id: "m16",
        role: "assistant",
        content:
          "Thank you, Sanchita. I have collected all required information — name, mobile number, incident date & time, location, crime type, and description. You may now generate your FIR draft.",
        timestamp: "2:37 PM",
      },
    ],
  },
  {
    id: "cyber-fraud",
    title: "Cyber Fraud — UPI Scam",
    preview: "Please share the transaction ID...",
    updatedAt: "Yesterday",
    isComplete: false,
    messages: [
      {
        id: "c1",
        role: "user",
        content: "Someone scammed me through a fake UPI payment link.",
        timestamp: "4:12 PM",
      },
      {
        id: "c2",
        role: "assistant",
        content:
          "I'm sorry to hear that. I'll help you file a cyber fraud FIR. What is your full name?",
        timestamp: "4:12 PM",
      },
    ],
  },
  {
    id: "lost-mobile",
    title: "Lost Mobile Phone",
    preview: "Where did you last remember having it?",
    updatedAt: "Jun 24",
    isComplete: false,
    messages: [
      {
        id: "l1",
        role: "user",
        content: "I lost my phone at the metro station.",
        timestamp: "11:05 AM",
      },
      {
        id: "l2",
        role: "assistant",
        content:
          "I'll assist you with filing a lost property report. What is your full name?",
        timestamp: "11:05 AM",
      },
    ],
  },
  {
    id: "chain-snatching",
    title: "Chain Snatching — Lajpat Nagar",
    preview: "Were you injured during the incident?",
    updatedAt: "Jun 20",
    isComplete: false,
    messages: [
      {
        id: "s1",
        role: "user",
        content: "Two men on a bike snatched my gold chain.",
        timestamp: "7:48 PM",
      },
      {
        id: "s2",
        role: "assistant",
        content:
          "This is a serious offense. I'll help you register an FIR immediately. What is your full name?",
        timestamp: "7:48 PM",
      },
    ],
  },
];

export const AI_RESPONSES: Record<string, string> = {
  initial:
    "I'll help you register an FIR. What is your full name?",
  name: "Thank you. What is your mobile number?",
  mobileNumber:
    "When exactly did the incident occur? Please provide the date.",
  incidentDate: "What time did this happen?",
  incidentTime: "Where did the incident occur?",
  location:
    "What type of crime was committed? (e.g., theft, assault, fraud, cyber crime)",
  crimeType:
    "Please provide a brief description of the incident — including relevant details and any witnesses.",
  description:
    "Thank you. I have collected all required information — name, mobile number, incident date & time, location, crime type, and description. You may now generate your FIR draft.",
};

export const FIR_FIELD_ORDER = [
  "name",
  "mobileNumber",
  "incidentDate",
  "incidentTime",
  "location",
  "crimeType",
  "description",
] as const;
