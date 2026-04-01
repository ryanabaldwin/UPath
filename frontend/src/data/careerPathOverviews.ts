export type CareerPathId =
  | "software-development"
  | "computer-engineering"
  | "product-management"
  | "healthcare"
  | "business-entrepreneurship"
  | "education"
  | "creative-arts-design"
  | "trades-technical"
  | "science"
  | "data-analytics";

export interface CareerPathOverview {
  id: CareerPathId;
  title: string;
  emoji: string;
  tagline: string;
  summary: string;
  idealFor: string[];
  firstSteps: string[];
  commonRoles: string[];
  educationAndTraining: string;
  timeToEntry: string;
  salaryRange: string;
}

export const CAREER_PATH_OVERVIEWS: Record<CareerPathId, CareerPathOverview> = {
  "software-development": {
    id: "software-development",
    title: "Software Development",
    emoji: "💻",
    tagline: "Turn ideas into apps, websites, and tools people use every day.",
    summary:
      "Software developers design and build the apps, websites, and systems that power our world. From mobile apps and games to tools used in hospitals and schools, this path lets you solve real problems with code.",
    idealFor: [
      "You like solving puzzles or logic problems",
      "You enjoy building projects or tinkering with technology",
      "You’re okay with learning step-by-step over time",
    ],
    firstSteps: [
      "Try a free beginner coding course (HTML/CSS, JavaScript, or Python)",
      "Build one small project, like a simple website or game",
      "Join a beginner-friendly online community or club",
    ],
    commonRoles: [
      "Junior Software Engineer",
      "Web Developer",
      "Mobile App Developer",
      "QA / Test Engineer",
    ],
    educationAndTraining:
      "Can start with self-study and projects, coding bootcamps, or an Associate’s/Bachelor’s degree in Computer Science or a related field.",
    timeToEntry: "6–24 months for entry-level or apprenticeship-style roles, longer for some degree programs.",
    salaryRange: "$70K–$150K+ depending on location, company, and experience.",
  },
  "computer-engineering": {
    id: "computer-engineering",
    title: "Computer Engineering",
    emoji: "🖥️",
    tagline: "Work at the intersection of hardware and software.",
    summary:
      "Computer engineers design and test the physical parts of computers and electronics—like processors, circuit boards, and devices—often working closely with software and electrical systems.",
    idealFor: [
      "You’re curious about how computers and electronics work inside",
      "You enjoy building or fixing gadgets, robots, or electronics",
      "You like math and science and don’t mind hands-on lab work",
    ],
    firstSteps: [
      "Explore a beginner electronics or robotics kit",
      "Take physics and algebra (or higher) seriously in school",
      "Join a robotics club, maker space, or engineering program if available",
    ],
    commonRoles: [
      "Computer Hardware Engineer",
      "Embedded Systems Engineer",
      "Firmware Engineer",
      "Test Engineer",
    ],
    educationAndTraining:
      "Often requires a Bachelor’s degree in Computer Engineering, Electrical Engineering, or a related field. Hands-on lab and project experience is important.",
    timeToEntry: "2–4+ years depending on degree or training path.",
    salaryRange: "$80K–$150K+ depending on role and industry.",
  },
  "product-management": {
    id: "product-management",
    title: "Product Management",
    emoji: "📌",
    tagline: "Guide teams to build products that truly help people.",
    summary:
      "Product managers connect the dots between users, business goals, and engineering. They decide what to build next, why it matters, and how to launch it successfully.",
    idealFor: [
      "You like organizing ideas and making decisions",
      "You enjoy talking to people and understanding their needs",
      "You’re comfortable working with both technical and non-technical teammates",
    ],
    firstSteps: [
      "Shadow or talk to someone who works on products or projects",
      "Help manage a small project at school, work, or in your community",
      "Learn the basics of user research, roadmaps, and MVPs (minimum viable products)",
    ],
    commonRoles: [
      "Product Manager (Associate/Junior)",
      "Project Coordinator",
      "Business Analyst",
      "Program Coordinator",
    ],
    educationAndTraining:
      "Can come from many backgrounds: business, design, engineering, or even teaching. Certificates, bootcamps, or on-the-job experience managing projects can help.",
    timeToEntry:
      "1–3+ years, often after experience in another role (like support, design, or engineering).",
    salaryRange: "$75K–$160K+ depending on company size and level.",
  },
  healthcare: {
    id: "healthcare",
    title: "Healthcare",
    emoji: "🩺",
    tagline: "Care for people’s health and make a direct impact every day.",
    summary:
      "Healthcare careers range from nurses and medical assistants to techs, therapists, and more. Many roles focus on patient care, teamwork, and improving people’s quality of life.",
    idealFor: [
      "You want to help people in a hands-on way",
      "You stay calm in stressful situations and care about details",
      "You’re willing to learn medical terms, procedures, and safety rules",
    ],
    firstSteps: [
      "Volunteer or work in a clinic, hospital, or care setting if possible",
      "Take biology and health science classes seriously",
      "Explore entry-level certifications like CNA, EMT, or medical assistant programs",
    ],
    commonRoles: [
      "Nurse or Nurse Assistant",
      "Medical Assistant",
      "Lab or Pharmacy Technician",
      "Community Health Worker",
    ],
    educationAndTraining:
      "Ranges from short certificate programs to multi-year degrees, depending on the role. Many paths allow you to work while continuing your education.",
    timeToEntry: "6 months–4+ years depending on credential and specialty.",
    salaryRange: "$35K–$120K+ depending on role, setting, and region.",
  },
  "business-entrepreneurship": {
    id: "business-entrepreneurship",
    title: "Business & Entrepreneurship",
    emoji: "📈",
    tagline: "Start or grow organizations that solve real problems.",
    summary:
      "Business and entrepreneurship careers focus on building, growing, or improving organizations. This can mean starting your own company, working in marketing or finance, or helping a nonprofit grow.",
    idealFor: [
      "You have ideas for products, services, or ways to improve things",
      "You’re comfortable with some risk and learning from failure",
      "You enjoy talking to people, selling ideas, or planning strategy",
    ],
    firstSteps: [
      "Start a small project or side hustle (online shop, tutoring, local service)",
      "Learn the basics of budgets, pricing, and simple business plans",
      "Join an entrepreneurship club, pitch competition, or mentorship program",
    ],
    commonRoles: [
      "Entrepreneur / Small Business Owner",
      "Marketing or Sales Associate",
      "Operations Coordinator",
      "Financial or Business Analyst",
    ],
    educationAndTraining:
      "Can be self-taught through experience, mentorship, and online resources, or supported by business degrees, accelerator programs, or certificates.",
    timeToEntry:
      "Months to start a small venture; 1–4+ years for certain corporate or finance roles.",
    salaryRange:
      "Highly variable — from early-stage, low pay to very high earnings if a business or role grows.",
  },
  education: {
    id: "education",
    title: "Education",
    emoji: "📚",
    tagline: "Teach, mentor, and help people grow through learning.",
    summary:
      "Education careers include classroom teachers, tutors, counselors, and program coordinators. You’ll design learning experiences, support students, and often build strong relationships over time.",
    idealFor: [
      "You like explaining things and seeing others “get it”",
      "You’re patient and willing to adapt to different learning styles",
      "You care about young people, equity, and access to opportunity",
    ],
    firstSteps: [
      "Tutor peers or younger students in a subject you’re strong in",
      "Volunteer with after-school programs, camps, or community centers",
      "Explore education degrees, alternative certification, or teaching fellowships",
    ],
    commonRoles: [
      "Teacher (K–12 or adult education)",
      "Tutor or Teaching Assistant",
      "School or Program Coordinator",
      "College Access or Career Coach",
    ],
    educationAndTraining:
      "Many roles require a Bachelor’s degree plus teaching credentials, but some tutoring or support roles have more flexible requirements.",
    timeToEntry: "1–4+ years depending on degree, credential path, and local rules.",
    salaryRange: "$35K–$90K+ depending on role, region, and level.",
  },
  "creative-arts-design": {
    id: "creative-arts-design",
    title: "Creative Arts & Design",
    emoji: "🎨",
    tagline: "Bring stories, brands, and ideas to life visually.",
    summary:
      "Creative arts and design careers include graphic design, animation, illustration, photography, and more. You may design logos, social media posts, videos, or sets for performances.",
    idealFor: [
      "You love drawing, designing, filming, or editing",
      "You notice details in colors, layouts, and visuals",
      "You’re open to feedback and revising your work",
    ],
    firstSteps: [
      "Build a small portfolio: posters, logos, videos, or digital art",
      "Learn design basics like color, typography, and composition",
      "Offer to design for a school club, local group, or small business",
    ],
    commonRoles: [
      "Graphic Designer",
      "Content Creator",
      "Animator or Video Editor",
      "UX/UI or Visual Designer (with additional training)",
    ],
    educationAndTraining:
      "Can start with self-taught skills and a strong portfolio, community college programs, or art and design degrees.",
    timeToEntry:
      "6–24 months to build a starter portfolio; 2–4+ years for some specialized roles or degrees.",
    salaryRange: "$35K–$100K+ depending on role, industry, and freelance vs. full-time.",
  },
  "trades-technical": {
    id: "trades-technical",
    title: "Trades & Technical Skills",
    emoji: "🛠️",
    tagline: "Build, repair, and keep our communities running.",
    summary:
      "Skilled trades professionals like electricians, plumbers, welders, and HVAC technicians work with their hands and tools to keep homes, buildings, and infrastructure safe and working.",
    idealFor: [
      "You prefer active, hands-on work over sitting at a desk all day",
      "You like fixing things and seeing visible results from your work",
      "You’re comfortable learning safety rules and working with tools or machinery",
    ],
    firstSteps: [
      "Explore pre-apprenticeship or trade exploration programs",
      "Talk to a tradesperson about their day-to-day work",
      "Look into union apprenticeship programs or community college trade programs",
    ],
    commonRoles: [
      "Electrician",
      "Plumber",
      "HVAC Technician",
      "Welder or Construction Apprentice",
    ],
    educationAndTraining:
      "Often involves apprenticeships, trade school, or community college programs that combine classroom learning with paid, on-the-job training.",
    timeToEntry: "6 months–4 years depending on trade and apprenticeship length.",
    salaryRange: "$40K–$100K+ depending on trade, certifications, and overtime.",
  },
  science: {
    id: "science",
    title: "Science",
    emoji: "🔬",
    tagline: "Investigate how the world works and solve complex problems.",
    summary:
      "Science careers include research, lab work, environmental studies, and more. You might study climate change, develop new medicines, or analyze data to inform big decisions.",
    idealFor: [
      "You’re curious and enjoy asking “why?” and “what if?”",
      "You like experiments, data, and careful observation",
      "You’re patient and okay with trial and error",
    ],
    firstSteps: [
      "Join a science club, fair, or research program if available",
      "Take lab-based science classes seriously (biology, chemistry, physics)",
      "Look for summer programs or internships in labs or fieldwork",
    ],
    commonRoles: [
      "Lab Technician",
      "Research Assistant",
      "Environmental Scientist",
      "Data or Research Analyst",
    ],
    educationAndTraining:
      "Most science roles require at least a Bachelor’s degree, and many research roles need advanced degrees. However, entry-level lab and tech roles may be available with 2-year degrees or certificates.",
    timeToEntry: "2–6+ years depending on degree level and specialty.",
    salaryRange: "$40K–$120K+ depending on field, education, and sector.",
  },
  "data-analytics": {
    id: "data-analytics",
    title: "Data Analytics",
    emoji: "📊",
    tagline: "Turn raw information into clear answers and better decisions.",
    summary:
      "Data analytics careers focus on collecting, cleaning, analyzing, and visualizing data. Analysts help teams understand trends, measure performance, and make evidence-based choices in business, healthcare, education, and public policy.",
    idealFor: [
      "You like finding patterns and explaining what numbers mean",
      "You’re comfortable with spreadsheets, charts, or learning tools like SQL or Python",
      "You enjoy answering concrete questions with evidence",
    ],
    firstSteps: [
      "Take a free intro to spreadsheets and charts (e.g. Google Sheets or Excel)",
      "Try a short course on data literacy, SQL, or visualization basics",
      "Practice on a small dataset you care about—sports, school, or a hobby",
    ],
    commonRoles: [
      "Data Analyst",
      "Business Intelligence Analyst",
      "Reporting Analyst",
      "Operations or Marketing Analyst",
    ],
    educationAndTraining:
      "Many roles expect strong math and statistics comfort plus tools (Excel, SQL, BI tools). Bootcamps, certificates, Associate’s/Bachelor’s degrees in analytics, business, or STEM are common entry paths.",
    timeToEntry: "6–24 months with focused learning and portfolio projects; longer with a full degree.",
    salaryRange: "$55K–$110K+ depending on industry, location, and experience.",
  },
};

