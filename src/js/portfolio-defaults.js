export const DEFAULT_PORTFOLIO_CONTENT = {
  profile: {
    full_name: "Ndukwe Michael Okorie Junior",
    role_line: "Frontend Developer • Fullstack in Training • Cybersecurity Student",
    about_heading: "Building clean interfaces with a security-conscious mindset.",
    about_intro:
      "I am a student and fast learner with a strong interest in frontend web development, full stack engineering, and cybersecurity.",
    about_body:
      "I enjoy building clean portfolio-style interfaces and growing my skills in PHP, Python, ethical hacking, penetration testing, and network mapping.",
    about_goal:
      "My goal is to combine modern web development with security awareness so I can build useful, responsive, and safer digital experiences.",
    about_tags: [
      "Frontend Development",
      "Fullstack Learning",
      "Cybersecurity",
      "Network Mapping",
    ],
    profile_image_url: "./src/assets/images/profile.jpg",
    profile_image_alt: "Ndukwe Michael Okorie Junior",
    cv_url: "./public/files/Ndukwe_Michael_Okorie_Junior_CV.pdf",
  },
  skills: [
    {
      id: "frontend",
      category: "Frontend",
      description:
        "The tools I use most confidently when building responsive frontend interfaces.",
      icon: "fa-solid fa-code",
      items: [
        { id: "html", name: "HTML", percent: 92 },
        { id: "css", name: "CSS", percent: 88 },
        { id: "tailwind", name: "Tailwind CSS", percent: 86 },
        { id: "javascript", name: "JavaScript", percent: 78 },
      ],
    },
    {
      id: "learning",
      category: "Learning",
      description:
        "Areas I am actively improving as I grow from frontend into broader development.",
      icon: "fa-solid fa-laptop-code",
      items: [
        { id: "react", name: "React", percent: 52 },
        { id: "php", name: "PHP", percent: 43 },
        { id: "python", name: "Python", percent: 58 },
        { id: "fullstack", name: "Fullstack Development", percent: 49 },
      ],
    },
    {
      id: "cybersecurity",
      category: "Cybersecurity",
      description:
        "Security topics I am studying through guided practice and hands-on exploration.",
      icon: "fa-solid fa-shield-halved",
      items: [
        { id: "pentest", name: "Penetration Testing", percent: 46 },
        { id: "ethical-hacking", name: "Ethical Hacking", percent: 42 },
        { id: "network-mapping", name: "Network Mapping", percent: 61 },
        { id: "soc", name: "SOC Fundamentals", percent: 38 },
      ],
    },
  ],
  projects: [
    {
      id: "portfolio-website",
      title: "Portfolio Website",
      summary:
        "My personal portfolio website built to showcase my skills, projects, and growth in web development and cybersecurity.",
      description:
        "This portfolio brings together smooth navigation, animated sections, a custom preloader, and a clean cyber-inspired interface to present my frontend work and growing cybersecurity interests in one place.",
      tags: ["HTML", "Tailwind CSS", "JavaScript"],
      icon: "fa-solid fa-laptop-code",
      image_url: "./src/assets/images/preview.png",
      image_alt: "Preview image for Mike Cyber Dev portfolio website",
      link_url: "https://github.com/Mikecyberdev",
      link_label: "View on GitHub",
    },
    {
      id: "estate-project",
      title: "Estate Project",
      summary:
        "An ongoing project focused on solving real estate-related needs with a clean and user-friendly web interface.",
      description:
        "This ongoing concept focuses on a modern real-estate experience with a clear layout, approachable property presentation, and room for future search, listing, and contact features.",
      tags: ["In Progress", "UI Design", "Web Interface"],
      icon: "fa-solid fa-building",
      image_url: "./src/assets/images/background-cyber.jpg",
      image_alt: "Preview image for estate project concept",
      link_url: "https://github.com/Mikecyberdev",
      link_label: "View on GitHub",
    },
    {
      id: "android-security-lab",
      title: "Android Security Testing Lab",
      summary:
        "A controlled learning project focused on understanding mobile security concepts, authorized testing workflows, and security awareness.",
      description:
        "This learning lab is centered on authorized Android security practice, helping me study testing workflows, understand common mobile risks, and build a stronger security mindset through controlled experimentation.",
      tags: ["Security Research", "Lab Practice", "Mobile Security"],
      icon: "fa-solid fa-shield-halved",
      image_url: "./src/assets/images/background-cyber.jpg",
      image_alt: "Preview image for Android security testing lab",
      link_url: "https://github.com/Mikecyberdev",
      link_label: "View on GitHub",
    },
  ],
};

function asString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asArrayOfStrings(value, fallback = []) {
  if (value === undefined || value === null) {
    return [...fallback];
  }

  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return normalized;
}

function clampPercent(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(number)));
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function cloneDefaultPortfolioContent() {
  return JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_CONTENT));
}

export function normalizePortfolioContent(rawContent = {}) {
  const defaults = cloneDefaultPortfolioContent();
  const rawProfile = rawContent.profile || {};

  const profile = {
    full_name: asString(rawProfile.full_name, defaults.profile.full_name),
    role_line: asString(rawProfile.role_line, defaults.profile.role_line),
    about_heading: asString(rawProfile.about_heading, defaults.profile.about_heading),
    about_intro: asString(rawProfile.about_intro, defaults.profile.about_intro),
    about_body: asString(rawProfile.about_body, defaults.profile.about_body),
    about_goal: asString(rawProfile.about_goal, defaults.profile.about_goal),
    about_tags:
      rawProfile.about_tags === undefined
        ? [...defaults.profile.about_tags]
        : asArrayOfStrings(rawProfile.about_tags, defaults.profile.about_tags),
    profile_image_url: asString(
      rawProfile.profile_image_url,
      defaults.profile.profile_image_url
    ),
    profile_image_alt: asString(
      rawProfile.profile_image_alt,
      defaults.profile.profile_image_alt
    ),
    cv_url: asString(rawProfile.cv_url, defaults.profile.cv_url),
  };

  const skills = Array.isArray(rawContent.skills)
    ? rawContent.skills.map((group, groupIndex) => ({
        id: asString(group?.id, createId(`skill-group-${groupIndex}`)),
        category: asString(group?.category, `Skill Group ${groupIndex + 1}`),
        description: asString(group?.description, ""),
        icon: asString(group?.icon, "fa-solid fa-code"),
        items: Array.isArray(group?.items) && group.items.length
          ? group.items.map((item, itemIndex) => ({
              id: asString(item?.id, createId(`skill-item-${itemIndex}`)),
              name: asString(item?.name, `Skill ${itemIndex + 1}`),
              percent: clampPercent(item?.percent, 50),
            }))
          : [],
      }))
    : defaults.skills;

  const projects = Array.isArray(rawContent.projects)
    ? rawContent.projects.map((project, projectIndex) => ({
        id: asString(project?.id, createId(`project-${projectIndex}`)),
        title: asString(project?.title, `Project ${projectIndex + 1}`),
        summary: asString(project?.summary, ""),
        description: asString(project?.description, ""),
        tags: asArrayOfStrings(project?.tags, []),
        icon: asString(project?.icon, "fa-solid fa-laptop-code"),
        image_url: asString(project?.image_url, defaults.projects[0].image_url),
        image_alt: asString(project?.image_alt, project?.title || "Project preview"),
        link_url: asString(project?.link_url, "https://github.com/Mikecyberdev"),
        link_label: asString(project?.link_label, "View Project"),
      }))
    : defaults.projects;

  return {
    profile,
    skills,
    projects,
  };
}
