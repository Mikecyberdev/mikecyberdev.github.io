import {
  SITE_CONTENT_SLUG,
  getSupabaseClient,
} from "./supabase-config.js";
import {
  cloneDefaultPortfolioContent,
  normalizePortfolioContent,
} from "./portfolio-defaults.js";

const supabase = getSupabaseClient();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setTextContent(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value;
}

function setImage(id, src, alt) {
  const element = document.getElementById(id);
  if (!element) return;
  element.src = src;
  if (alt) {
    element.alt = alt;
  }
}

function setHref(id, href) {
  const element = document.getElementById(id);
  if (!element || !href) return;
  element.href = href;
}

function renderAboutTags(tags) {
  const tagsContainer = document.getElementById("about-tags");
  if (!tagsContainer) return;

  tagsContainer.innerHTML = "";

  tags.forEach((tag) => {
    const tagEl = document.createElement("span");
    tagEl.className =
      "rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-cyan-400/20";
    tagEl.textContent = tag;
    tagsContainer.appendChild(tagEl);
  });
}

function renderSkills(skills) {
  const skillsGrid = document.getElementById("skills-grid");
  if (!skillsGrid) return;

  skillsGrid.innerHTML = "";

  skills.forEach((group, groupIndex) => {
    const article = document.createElement("article");
    article.className =
      "rounded-2xl border border-cyan-400/15 bg-white/5 p-6 shadow-lg transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:shadow-cyan-500/10";
    article.setAttribute("data-aos", "fade-up");
    article.setAttribute("data-aos-delay", String((groupIndex + 1) * 100));

    const itemsMarkup = group.items
      .map(
        (item) => `
          <div>
            <div class="mb-2 flex items-center justify-between text-sm">
              <span class="font-medium text-white">${escapeHtml(item.name)}</span>
              <span class="text-cyan-300">${item.percent}%</span>
            </div>
            <div class="skill-progress h-2.5">
              <div
                class="skill-progress-fill"
                style="--skill-level: ${item.percent}%;"
                role="progressbar"
                aria-label="${escapeHtml(item.name)} proficiency"
                aria-valuenow="${item.percent}"
                aria-valuemin="0"
                aria-valuemax="100"></div>
            </div>
          </div>
        `
      )
      .join("");

    article.innerHTML = `
      <div class="mb-5 flex items-center gap-3">
        <div class="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
          <i class="${escapeHtml(group.icon)} text-lg"></i>
        </div>
        <h3 class="text-2xl font-semibold">${escapeHtml(group.category)}</h3>
      </div>

      <p class="mb-6 text-sm leading-7 text-gray-300">
        ${escapeHtml(group.description)}
      </p>

      <div class="space-y-5">
        ${itemsMarkup}
      </div>
    `;

    skillsGrid.appendChild(article);
  });
}

function buildProjectCard(project, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "project-card group block h-full rounded-2xl border border-cyan-400/15 bg-white/5 p-6 text-left shadow-lg transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/10 hover:shadow-cyan-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]";
  button.dataset.projectTitle = project.title;
  button.dataset.projectImage = project.image_url;
  button.dataset.projectAlt = project.image_alt;
  button.dataset.projectDescription = project.description;
  button.dataset.projectTags = project.tags.join(",");
  button.dataset.projectLink = project.link_url;
  button.dataset.projectLinkLabel = project.link_label;
  button.setAttribute("data-aos", "fade-up");
  button.setAttribute("data-aos-delay", String((index + 1) * 100));

  const tagsMarkup = project.tags
    .map(
      (tag) => `
        <span class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
          ${escapeHtml(tag)}
        </span>
      `
    )
    .join("");

  button.innerHTML = `
    <div class="mb-5 flex items-center gap-3">
      <div class="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
        <i class="${escapeHtml(project.icon)} text-lg"></i>
      </div>
      <h3 class="text-2xl font-semibold">${escapeHtml(project.title)}</h3>
    </div>

    <p class="mb-6 text-sm leading-8 text-gray-300 md:text-base">
      ${escapeHtml(project.summary)}
    </p>

    <div class="flex flex-wrap gap-2">
      ${tagsMarkup}
    </div>

    <div class="mt-6 flex items-center gap-2 text-sm font-medium text-cyan-300">
      <span>Tap to preview</span>
      <i class="fa-solid fa-arrow-right transition duration-300 group-hover:translate-x-1"></i>
    </div>
  `;

  return button;
}

function renderProjects(projects) {
  const projectsGrid = document.getElementById("projects-grid");
  if (!projectsGrid) return;

  projectsGrid.innerHTML = "";

  projects.forEach((project, index) => {
    projectsGrid.appendChild(buildProjectCard(project, index));
  });
}

function applyProfile(profile) {
  setTextContent("about-name", profile.full_name);
  setTextContent("about-role", profile.role_line);
  setTextContent("about-heading", profile.about_heading);
  setTextContent("about-paragraph-1", profile.about_intro);
  setTextContent("about-paragraph-2", profile.about_body);
  setTextContent("about-paragraph-3", profile.about_goal);

  setImage(
    "about-profile-image",
    profile.profile_image_url,
    profile.profile_image_alt || profile.full_name
  );

  setHref("nav-cv-link", profile.cv_url);
  setHref("mobile-cv-link", profile.cv_url);
  setHref("hero-cv-link", profile.cv_url);

  renderAboutTags(profile.about_tags);
}

async function fetchPortfolioContent() {
  try {
    const { data, error } = await supabase
      .from("site_content")
      .select("profile, skills, projects")
      .eq("slug", SITE_CONTENT_SLUG)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return cloneDefaultPortfolioContent();
    }

    return normalizePortfolioContent(data);
  } catch (error) {
    console.warn("Falling back to local portfolio content.", error);
    return cloneDefaultPortfolioContent();
  }
}

function refreshInteractiveSections() {
  if (typeof window.setupSkillProgressAnimation === "function") {
    window.setupSkillProgressAnimation();
  }

  if (typeof window.setupProjectModal === "function") {
    window.setupProjectModal();
  }

  if (window.AOS && typeof window.AOS.refreshHard === "function") {
    window.AOS.refreshHard();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const portfolioContent = await fetchPortfolioContent();

  applyProfile(portfolioContent.profile);
  renderSkills(portfolioContent.skills);
  renderProjects(portfolioContent.projects);
  refreshInteractiveSections();
});
