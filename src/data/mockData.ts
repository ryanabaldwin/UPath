export interface Milestone {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  steps?: string[];
}

export interface Mentor {
  id: number;
  name: string;
  specialty: string;
  description: string;
  avatar: string;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  category: "Scholarships" | "Jobs" | "College";
  link: string;
}

export const milestones: Milestone[] = [
  { id: 1, title: "Discover Your Interests", description: "Take a career quiz and explore what excites you.", completed: true, steps: ["Complete career quiz", "List top 3 interests", "Research related careers"] },
  { id: 2, title: "Set Your First Goal", description: "Choose a career direction and write down your goal.", completed: true, steps: ["Pick a career path", "Write a SMART goal", "Share with a mentor"] },
  { id: 3, title: "Connect with a Mentor", description: "Find someone who can guide you on your journey.", completed: false, steps: ["Browse mentors", "Send an intro message", "Schedule your first meeting"] },
  { id: 4, title: "Build Your Skills", description: "Start learning the skills you need for your career.", completed: false, steps: ["Find a free online course", "Practice for 30 mins daily", "Complete your first project"] },
  { id: 5, title: "Apply for Opportunities", description: "Take the leap and apply for scholarships or internships.", completed: false, steps: ["Update your resume", "Write a cover letter", "Submit 3 applications"] },
  { id: 6, title: "Land Your First Role", description: "Celebrate getting your first job or internship!", completed: false, steps: ["Prepare for interviews", "Attend career fairs", "Follow up on applications"] },
];

export const mentors: Mentor[] = [
  { id: 1, name: "Sarah Johnson", specialty: "Software Engineering", description: "Senior engineer at a tech company. Passionate about helping underrepresented youth break into tech.", avatar: "SJ" },
  { id: 2, name: "Marcus Williams", specialty: "Product Management", description: "PM lead who grew up in foster care. Knows firsthand the power of mentorship.", avatar: "MW" },
  { id: 3, name: "Priya Patel", specialty: "Healthcare", description: "Nurse practitioner and first-gen college grad. Loves guiding students through college apps.", avatar: "PP" },
  { id: 4, name: "David Chen", specialty: "Computer Engineering", description: "Hardware engineer who volunteers with coding bootcamps for youth.", avatar: "DC" },
  { id: 5, name: "Aaliyah Brooks", specialty: "Business & Entrepreneurship", description: "Small business owner who mentors young entrepreneurs in her community.", avatar: "AB" },
];

export const resources: Resource[] = [
  { id: 1, title: "Gates Millennium Scholarship", description: "Full scholarship for outstanding minority students with financial need.", category: "Scholarships", link: "#" },
  { id: 2, title: "Google Summer Internship", description: "Paid summer internship for students interested in technology.", category: "Jobs", link: "#" },
  { id: 3, title: "QuestBridge National College Match", description: "Connects high-achieving, low-income students with top colleges.", category: "College", link: "#" },
  { id: 4, title: "Year Up Program", description: "One-year career development program with internship placement.", category: "Jobs", link: "#" },
  { id: 5, title: "Dell Scholars Program", description: "Scholarship plus support services for students who are Pell-eligible.", category: "Scholarships", link: "#" },
  { id: 6, title: "Common App Fee Waivers", description: "Apply to college for free if you meet income eligibility.", category: "College", link: "#" },
  { id: 7, title: "Microsoft TEALS Program", description: "Volunteer-led CS education in underserved high schools.", category: "Jobs", link: "#" },
  { id: 8, title: "Jack Kent Cooke Foundation", description: "Generous scholarships for high-achieving students with financial need.", category: "Scholarships", link: "#" },
];

export const careerPaths = [
  "Software Development",
  "Computer Engineering",
  "Product Management",
  "Healthcare",
  "Business & Entrepreneurship",
  "Education",
  "Creative Arts & Design",
  "Trades & Technical Skills",
];
