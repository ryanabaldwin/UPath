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

import type { ParticipantCareerArea } from "@/constants/participantInterests";
import type { CareerPathId } from "@/data/careerPathOverviews";

export interface Resource {
  id: number;
  title: string;
  description: string;
  category: "Scholarships" | "Jobs" | "Internships" | "College";
  link: string;
  /** Aligns with onboarding interest areas; omit until API returns this field. */
  career_areas?: ParticipantCareerArea[];
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
  // Scholarships
  {
    id: 1,
    title: "Gates Millennium Scholarship",
    description: "Full scholarship for outstanding minority students with financial need.",
    category: "Scholarships",
    link: "#",
    career_areas: ["Social Impact", "Education"],
  },
  {
    id: 5,
    title: "Dell Scholars Program",
    description: "Scholarship plus support services for students who are Pell-eligible.",
    category: "Scholarships",
    link: "#",
    career_areas: ["Technology", "Education"],
  },
  {
    id: 8,
    title: "Jack Kent Cooke Foundation",
    description: "Generous scholarships for high-achieving students with financial need.",
    category: "Scholarships",
    link: "#",
    career_areas: ["Science & Research", "Education"],
  },
  {
    id: 9,
    title: "NIH Undergraduate Scholarship Program",
    description: "Scholarship and paid research training for students committed to careers in health-related research.",
    category: "Scholarships",
    link: "#",
    career_areas: ["Healthcare", "Science & Research"],
  },
  {
    id: 10,
    title: "YoungArts Award",
    description: "Recognition and financial awards for high school artists in visual, literary, and performing arts.",
    category: "Scholarships",
    link: "#",
    career_areas: ["Arts & Creative"],
  },
  {
    id: 11,
    title: "Goldman Sachs MBA Fellowship (undergrad pipeline)",
    description: "Merit scholarship for undergraduates interested in business and finance careers.",
    category: "Scholarships",
    link: "#",
    career_areas: ["Business & Finance"],
  },
  {
    id: 12,
    title: "Society of Women Engineers Scholarships",
    description: "Multiple awards for women pursuing engineering or computer science degrees.",
    category: "Scholarships",
    link: "#",
    career_areas: ["Engineering", "Technology"],
  },
  {
    id: 13,
    title: "Horatio Alger National Scholarship",
    description: "Scholarships for students who have overcome adversity and show strong commitment to education.",
    category: "Scholarships",
    link: "#",
    career_areas: ["Social Impact", "Education"],
  },
  // Internships
  {
    id: 2,
    title: "Google Summer of Code",
    description: "Stipend-based open-source coding program with mentoring organizations worldwide.",
    category: "Internships",
    link: "#",
    career_areas: ["Technology"],
  },
  {
    id: 4,
    title: "Year Up",
    description: "One-year career development program with internship placement at major employers.",
    category: "Internships",
    link: "#",
    career_areas: ["Business & Finance", "Social Impact"],
  },
  {
    id: 14,
    title: "Kaiser Permanente Health Scholars Internship",
    description: "Summer experience in clinical and community health settings for aspiring healthcare professionals.",
    category: "Internships",
    link: "#",
    career_areas: ["Healthcare"],
  },
  {
    id: 15,
    title: "Smithsonian Institution Internships",
    description: "Museum, education, and public history projects for students passionate about culture and learning.",
    category: "Internships",
    link: "#",
    career_areas: ["Arts & Creative", "Education"],
  },
  {
    id: 16,
    title: "NASA Internship Program",
    description: "STEM internships at NASA centers for high school through graduate students.",
    category: "Internships",
    link: "#",
    career_areas: ["Engineering", "Science & Research"],
  },
  {
    id: 17,
    title: "Bank of America Student Leaders",
    description: "Paid summer internship with a nonprofit plus leadership summit for community-minded students.",
    category: "Internships",
    link: "#",
    career_areas: ["Business & Finance", "Social Impact"],
  },
  {
    id: 18,
    title: "CodePath Summer Internship Accelerator",
    description: "Technical interview prep and referral network for software engineering internships.",
    category: "Internships",
    link: "#",
    career_areas: ["Technology", "Engineering"],
  },
  // Jobs
  {
    id: 7,
    title: "Microsoft TEALS (Teaching)",
    description: "Volunteer or paid pathways to help teach computer science in high schools.",
    category: "Jobs",
    link: "#",
    career_areas: ["Technology", "Education"],
  },
  {
    id: 19,
    title: "AmeriCorps City Year",
    description: "Full-time service in schools supporting student success and college readiness.",
    category: "Jobs",
    link: "#",
    career_areas: ["Education", "Social Impact"],
  },
  {
    id: 20,
    title: "Community Health Worker Trainee Program",
    description: "Entry-level roles with training for outreach, navigation, and wellness education.",
    category: "Jobs",
    link: "#",
    career_areas: ["Healthcare", "Social Impact"],
  },
  {
    id: 21,
    title: "Target Store Leadership Development",
    description: "Hourly-to-management pathways with benefits and flexible scheduling for students.",
    category: "Jobs",
    link: "#",
    career_areas: ["Business & Finance"],
  },
  {
    id: 22,
    title: "Junior Studio Assistant (Creative Guild)",
    description: "Apprentice-style roles in design, media, and production for emerging creatives.",
    category: "Jobs",
    link: "#",
    career_areas: ["Arts & Creative"],
  },
  {
    id: 23,
    title: "Lab Technician Trainee (Regional Hospital)",
    description: "On-the-job training for specimen processing and lab support with certification support.",
    category: "Jobs",
    link: "#",
    career_areas: ["Healthcare", "Science & Research"],
  },
  {
    id: 24,
    title: "Pre-Apprenticeship in Advanced Manufacturing",
    description: "Paid introduction to machining, robotics maintenance, and safety for industrial careers.",
    category: "Jobs",
    link: "#",
    career_areas: ["Engineering"],
  },
  // College
  {
    id: 3,
    title: "QuestBridge National College Match",
    description: "Connects high-achieving, low-income students with full four-year scholarships at partner colleges.",
    category: "College",
    link: "#",
    career_areas: ["Education", "Business & Finance"],
  },
  {
    id: 6,
    title: "Common App Fee Waivers",
    description: "Apply to college for free if you meet income eligibility guidelines.",
    category: "College",
    link: "#",
    career_areas: ["Education"],
  },
  {
    id: 25,
    title: "TRIO Upward Bound",
    description: "Free tutoring, college visits, and summer programs for first-gen and low-income students.",
    category: "College",
    link: "#",
    career_areas: ["Education", "Social Impact"],
  },
  {
    id: 26,
    title: "Posse Foundation",
    description: "Full-tuition leadership scholarship with cohort support at partner universities.",
    category: "College",
    link: "#",
    career_areas: ["Social Impact", "Education"],
  },
  {
    id: 27,
    title: "College Board BigFuture",
    description: "Free planning tools for majors, careers, SAT fee waivers, and scholarship search.",
    category: "College",
    link: "#",
    career_areas: ["Education"],
  },
  {
    id: 28,
    title: "NCSSM / State STEM Residential Programs",
    description: "Information on competitive public STEM high schools and dual-enrollment pathways.",
    category: "College",
    link: "#",
    career_areas: ["Science & Research", "Engineering", "Technology"],
  },
  {
    id: 29,
    title: "National Portfolio Day Association",
    description: "Free reviews and guidance for students applying to art and design colleges.",
    category: "College",
    link: "#",
    career_areas: ["Arts & Creative", "Education"],
  },
  {
    id: 30,
    title: "AAMC Aspiring Docs",
    description: "Resources on pre-med coursework, MCAT timing, and pathways into medicine.",
    category: "College",
    link: "#",
    career_areas: ["Healthcare", "Science & Research"],
  },
];

/** Labels + slugs aligned with backend `career_path_key` / milestone templates (10 paths). */
export const exploreCareerSections: ReadonlyArray<{ label: string; slug: CareerPathId }> = [
  { label: "Software Development", slug: "software-development" },
  { label: "Computer Engineering", slug: "computer-engineering" },
  { label: "Product Management", slug: "product-management" },
  { label: "Healthcare", slug: "healthcare" },
  { label: "Business & Entrepreneurship", slug: "business-entrepreneurship" },
  { label: "Education", slug: "education" },
  { label: "Creative Arts & Design", slug: "creative-arts-design" },
  { label: "Trades & Technical Skills", slug: "trades-technical" },
  { label: "Science", slug: "science" },
  { label: "Data Analytics", slug: "data-analytics" },
];

/** @deprecated Use exploreCareerSections for labels tied to overview slugs */
export const careerPaths = exploreCareerSections.map((s) => s.label);

// new mock data from Sarah for career exploration
export interface Career {
  id: number;
  title: string;
  description: string;
  category: string;
  averageSalary?: number;
}

export const careers: Career[] = [
  {
    id: 1,
    title: "Software Engineer",
    description: "Design and build applications, websites, and systems.",
    category: "Software Development",
    averageSalary: 90000,
  },
  {
    id: 2,
    title: "Nurse",
    description: "Provide care and support to patients in healthcare settings.",
    category: "Healthcare",
    averageSalary: 70000,
  },
  {
    id: 3,
    title: "Product Manager",
    description: "Guide product development and work with teams to build solutions.",
    category: "Product Management",
    averageSalary: 85000,
  },
  {
    id: 4,
    title: "Electrician",
    description: "Install and repair electrical systems in homes and buildings.",
    category: "Trades & Technical Skills",
    averageSalary: 60000,
  },
  {
    id: 5,
    title: "Computer Hardware Engineer",
    description: "Design and test computer hardware like processors, circuit boards, and devices.",
    category: "Computer Engineering",
    averageSalary: 95000,
  },
  {
    id: 6,
    title: "Entrepreneur",
    description: "Start and run your own business, turning ideas into real products or services.",
    category: "Business & Entrepreneurship",
    averageSalary: 60000,
  },
  {
    id: 7,
    title: "Teacher",
    description: "Educate and inspire students in subjects like math, science, or language arts.",
    category: "Education",
    averageSalary: 55000,
  },
  {
    id: 8,
    title: "Graphic Designer",
    description: "Create visual content like logos, websites, and social media graphics.",
    category: "Creative Arts & Design",
    averageSalary: 50000,
  },
  {
    id: 9,
    title: "Environmental Scientist",
    description: "Study the environment and help solve problems like pollution and climate change.",
    category: "Science",
    averageSalary: 65000,
  },
];