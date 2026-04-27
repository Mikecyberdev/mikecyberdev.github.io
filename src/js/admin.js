import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  SITE_ASSETS_BUCKET,
  SITE_CONTENT_SLUG,
  getSupabaseClient,
} from "./supabase-config.js";
import {
  cloneDefaultPortfolioContent,
  normalizePortfolioContent,
} from "./portfolio-defaults.js";

const supabase = getSupabaseClient();
const CONNECTION_TIMEOUT_MS = 8000;
const LOGIN_TIMEOUT_MS = 30000;

const state = {
  content: cloneDefaultPortfolioContent(),
  saveButtons: [],
};

const elements = {};

function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showStatus(message, type = "info") {
  elements.status.textContent = message;
  elements.status.className = "admin-status px-4 py-3 text-sm";

  if (type === "error") {
    elements.status.classList.add("is-error");
  }

  if (type === "success") {
    elements.status.classList.add("is-success");
  }

  elements.status.classList.remove("hidden");
}

function clearStatus() {
  elements.status.textContent = "";
  elements.status.className = "admin-status hidden px-4 py-3 text-sm";
}

function setBusy(buttons, isBusy, label) {
  buttons.forEach((button) => {
    if (!button) return;
    button.disabled = isBusy;

    if (label) {
      const original = button.dataset.originalHtml || button.innerHTML;
      button.dataset.originalHtml = original;
      button.innerHTML = isBusy
        ? `<i class="fa-solid fa-spinner fa-spin"></i>${label}`
        : original;
    }
  });
}

function splitCommaList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function withTimeout(task, timeoutMs, timeoutMessage) {
  let timeoutId;

  try {
    return await Promise.race([
      task,
      new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => {
          const error = new Error(timeoutMessage);
          error.name = "TimeoutError";
          reject(error);
        }, timeoutMs);
      }),
    ]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function canReachSupabase() {
  try {
    await withTimeout(
      fetch(`${SUPABASE_URL}/auth/v1/health`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
        },
      }),
      CONNECTION_TIMEOUT_MS,
      "Connection test timed out."
    );

    return true;
  } catch {
    return false;
  }
}

function getSignInErrorMessage(error) {
  if (error?.name === "TimeoutError") {
    return "Login timed out. Supabase is taking too long to respond. Check your network and try again.";
  }

  if (
    typeof error?.message === "string" &&
    /failed to fetch|load failed|networkerror|network request failed/i.test(error.message)
  ) {
    return "Network error while signing in. Check your internet connection and try again.";
  }

  return error?.message || "Sign in failed.";
}

function bindStaticElements() {
  elements.status = document.getElementById("admin-status");
  elements.loginPanel = document.getElementById("login-panel");
  elements.dashboardPanel = document.getElementById("dashboard-panel");
  elements.loginForm = document.getElementById("login-form");
  elements.loginEmail = document.getElementById("login-email");
  elements.loginPassword = document.getElementById("login-password");
  elements.loginSubmitBtn = document.getElementById("login-submit-btn");
  elements.loginSignOutBtn = document.getElementById("login-signout-btn");
  elements.sessionPill = document.getElementById("admin-session-pill");
  elements.saveTopBtn = document.getElementById("save-content-btn");
  elements.saveBottomBtn = document.getElementById("save-content-btn-bottom");
  elements.signOutBtn = document.getElementById("sign-out-btn");
  elements.profileFullName = document.getElementById("profile-full-name");
  elements.profileRoleLine = document.getElementById("profile-role-line");
  elements.profileAboutHeading = document.getElementById("profile-about-heading");
  elements.profileAboutIntro = document.getElementById("profile-about-intro");
  elements.profileAboutBody = document.getElementById("profile-about-body");
  elements.profileAboutGoal = document.getElementById("profile-about-goal");
  elements.profileAboutTags = document.getElementById("profile-about-tags");
  elements.profileImageUrl = document.getElementById("profile-image-url");
  elements.profileImageAlt = document.getElementById("profile-image-alt");
  elements.profileImageFile = document.getElementById("profile-image-file");
  elements.profileImagePreview = document.getElementById("profile-image-preview");
  elements.cvUrl = document.getElementById("cv-url");
  elements.cvFile = document.getElementById("cv-file");
  elements.cvLinkPreview = document.getElementById("cv-link-preview");
  elements.skillsAdminList = document.getElementById("skills-admin-list");
  elements.projectsAdminList = document.getElementById("projects-admin-list");
  elements.addSkillGroupBtn = document.getElementById("add-skill-group-btn");
  elements.addProjectBtn = document.getElementById("add-project-btn");

  state.saveButtons = [elements.saveTopBtn, elements.saveBottomBtn];
}

function hideAuthenticatedControls() {
  elements.sessionPill.classList.add("hidden");
  elements.saveTopBtn.classList.add("hidden");
  elements.saveBottomBtn.classList.add("hidden");
  elements.signOutBtn.classList.add("hidden");
  elements.loginSignOutBtn.classList.add("hidden");
  elements.sessionPill.textContent = "";
}

function showLoginPanel(options = {}) {
  const { allowSessionSignOut = false } = options;

  elements.loginPanel.classList.remove("hidden");
  elements.dashboardPanel.classList.add("hidden");
  hideAuthenticatedControls();

  if (allowSessionSignOut) {
    elements.loginSignOutBtn.classList.remove("hidden");
  }
}

function showDashboard(email) {
  elements.loginPanel.classList.add("hidden");
  elements.dashboardPanel.classList.remove("hidden");
  elements.sessionPill.classList.remove("hidden");
  elements.saveTopBtn.classList.remove("hidden");
  elements.saveBottomBtn.classList.remove("hidden");
  elements.signOutBtn.classList.remove("hidden");
  elements.loginSignOutBtn.classList.add("hidden");
  elements.sessionPill.textContent = email || "Authenticated";
}

async function ensureAdminAccess() {
  const { data, error } = await supabase.rpc("is_admin_user");

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function loadPortfolioContent() {
  const { data, error } = await supabase
    .from("site_content")
    .select("profile, skills, projects")
    .eq("slug", SITE_CONTENT_SLUG)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizePortfolioContent(data || {});
}

function renderProfileFields() {
  const { profile } = state.content;

  elements.profileFullName.value = profile.full_name;
  elements.profileRoleLine.value = profile.role_line;
  elements.profileAboutHeading.value = profile.about_heading;
  elements.profileAboutIntro.value = profile.about_intro;
  elements.profileAboutBody.value = profile.about_body;
  elements.profileAboutGoal.value = profile.about_goal;
  elements.profileAboutTags.value = profile.about_tags.join(", ");
  elements.profileImageUrl.value = profile.profile_image_url;
  elements.profileImageAlt.value = profile.profile_image_alt;
  elements.profileImagePreview.src = profile.profile_image_url;
  elements.profileImagePreview.alt = profile.profile_image_alt || "Profile preview";
  elements.cvUrl.value = profile.cv_url;
  elements.cvLinkPreview.href = profile.cv_url;
}

function buildSkillItemsMarkup(group, groupIndex) {
  return group.items
    .map(
      (item, itemIndex) => `
        <div class="admin-card rounded-2xl p-4" data-skill-item-index="${itemIndex}">
          <div class="mb-4 flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-cyan-300">Skill ${itemIndex + 1}</p>
            <button type="button" class="admin-btn-danger" data-remove-skill-item="${groupIndex}"
              data-item-index="${itemIndex}">
              <i class="fa-solid fa-trash"></i>
              Remove
            </button>
          </div>

          <div class="grid gap-4 md:grid-cols-[1fr,160px]">
            <div>
              <label class="admin-label">Skill name</label>
              <input class="admin-input" data-skill-name value="${escapeHtml(item.name)}" placeholder="Skill name" />
            </div>
            <div>
              <label class="admin-label">Percent</label>
              <input class="admin-input" data-skill-percent type="number" min="0" max="100" value="${item.percent}"
                placeholder="0 - 100" />
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderSkillsEditor() {
  elements.skillsAdminList.innerHTML = state.content.skills
    .map(
      (group, groupIndex) => `
        <section class="admin-card rounded-3xl p-5 sm:p-6" data-skill-group-index="${groupIndex}">
          <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="font-heading text-xs uppercase tracking-[0.3em] text-cyan-400">
                Category ${groupIndex + 1}
              </p>
              <h3 class="mt-2 text-xl font-semibold">${escapeHtml(group.category)}</h3>
            </div>
            <div class="flex flex-wrap gap-3">
              <button type="button" class="admin-btn-secondary" data-add-skill-item="${groupIndex}">
                <i class="fa-solid fa-plus"></i>
                Add Skill
              </button>
              <button type="button" class="admin-btn-danger" data-remove-skill-group="${groupIndex}">
                <i class="fa-solid fa-trash"></i>
                Remove Category
              </button>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="admin-label">Category name</label>
              <input class="admin-input" data-skill-category value="${escapeHtml(group.category)}" placeholder="Category name" />
            </div>
            <div>
              <label class="admin-label">Font Awesome icon classes</label>
              <input class="admin-input" data-skill-icon value="${escapeHtml(group.icon)}" placeholder="fa-solid fa-code" />
            </div>
            <div class="md:col-span-2">
              <label class="admin-label">Category description</label>
              <textarea class="admin-textarea" data-skill-description
                placeholder="Short description for this category">${escapeHtml(group.description)}</textarea>
            </div>
          </div>

          <div class="mt-6 space-y-4">
            ${buildSkillItemsMarkup(group, groupIndex)}
          </div>
        </section>
      `
    )
    .join("");
}

function buildProjectMarkup(project, projectIndex) {
  const tagsValue = project.tags.join(", ");
  const previewImage = project.image_url || "./src/assets/images/preview.png";

  return `
    <section class="admin-card rounded-3xl p-5 sm:p-6" data-project-index="${projectIndex}">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="font-heading text-xs uppercase tracking-[0.3em] text-cyan-400">
            Project ${projectIndex + 1}
          </p>
          <h3 class="mt-2 text-xl font-semibold">${escapeHtml(project.title)}</h3>
        </div>
        <button type="button" class="admin-btn-danger" data-remove-project="${projectIndex}">
          <i class="fa-solid fa-trash"></i>
          Remove Project
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="admin-label">Project title</label>
          <input class="admin-input" data-project-title value="${escapeHtml(project.title)}" placeholder="Project title" />
        </div>
        <div>
          <label class="admin-label">Font Awesome icon classes</label>
          <input class="admin-input" data-project-icon value="${escapeHtml(project.icon)}" placeholder="fa-solid fa-laptop-code" />
        </div>
        <div class="md:col-span-2">
          <label class="admin-label">Card summary</label>
          <textarea class="admin-textarea" data-project-summary
            placeholder="Short card summary">${escapeHtml(project.summary)}</textarea>
        </div>
        <div class="md:col-span-2">
          <label class="admin-label">Preview description</label>
          <textarea class="admin-textarea" data-project-description
            placeholder="Longer preview modal description">${escapeHtml(project.description)}</textarea>
        </div>
        <div class="md:col-span-2">
          <label class="admin-label">Tags</label>
          <input class="admin-input" data-project-tags value="${escapeHtml(tagsValue)}"
            placeholder="HTML, Tailwind CSS, JavaScript" />
        </div>
        <div>
          <label class="admin-label">Project link</label>
          <input class="admin-input" data-project-link-url value="${escapeHtml(project.link_url)}" placeholder="https://..." />
        </div>
        <div>
          <label class="admin-label">Link label</label>
          <input class="admin-input" data-project-link-label value="${escapeHtml(project.link_label)}" placeholder="View Project" />
        </div>
        <div class="md:col-span-2">
          <label class="admin-label">Image URL</label>
          <input class="admin-input" data-project-image-url value="${escapeHtml(project.image_url)}" placeholder="https://..." />
        </div>
        <div>
          <label class="admin-label">Image alt text</label>
          <input class="admin-input" data-project-image-alt value="${escapeHtml(project.image_alt)}" placeholder="Image alt text" />
        </div>
        <div>
          <label class="admin-label">Upload project image</label>
          <input type="file" accept="image/*" data-project-image-upload="${projectIndex}"
            class="block text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-300 hover:file:bg-cyan-400/25" />
        </div>
      </div>

      <div class="admin-preview mt-5 overflow-hidden rounded-2xl p-3">
        <img src="${escapeHtml(previewImage)}" alt="${escapeHtml(project.image_alt || project.title)}" class="h-56 w-full rounded-2xl object-cover" />
      </div>
    </section>
  `;
}

function renderProjectsEditor() {
  elements.projectsAdminList.innerHTML = state.content.projects
    .map((project, projectIndex) => buildProjectMarkup(project, projectIndex))
    .join("");
}

function syncProfileFromDom() {
  state.content.profile = {
    full_name: elements.profileFullName.value.trim(),
    role_line: elements.profileRoleLine.value.trim(),
    about_heading: elements.profileAboutHeading.value.trim(),
    about_intro: elements.profileAboutIntro.value.trim(),
    about_body: elements.profileAboutBody.value.trim(),
    about_goal: elements.profileAboutGoal.value.trim(),
    about_tags: splitCommaList(elements.profileAboutTags.value),
    profile_image_url: elements.profileImageUrl.value.trim(),
    profile_image_alt: elements.profileImageAlt.value.trim(),
    cv_url: elements.cvUrl.value.trim(),
  };
}

function syncSkillsFromDom() {
  const groups = Array.from(
    elements.skillsAdminList.querySelectorAll("[data-skill-group-index]")
  );

  state.content.skills = groups.map((groupEl, groupIndex) => ({
    id: state.content.skills[groupIndex]?.id || createId("skill-group"),
    category: groupEl.querySelector("[data-skill-category]")?.value.trim() || `Category ${groupIndex + 1}`,
    description: groupEl.querySelector("[data-skill-description]")?.value.trim() || "",
    icon: groupEl.querySelector("[data-skill-icon]")?.value.trim() || "fa-solid fa-code",
    items: Array.from(groupEl.querySelectorAll("[data-skill-item-index]")).map((itemEl, itemIndex) => ({
      id: state.content.skills[groupIndex]?.items?.[itemIndex]?.id || createId("skill-item"),
      name: itemEl.querySelector("[data-skill-name]")?.value.trim() || `Skill ${itemIndex + 1}`,
      percent: Math.max(
        0,
        Math.min(100, Number(itemEl.querySelector("[data-skill-percent]")?.value || 0))
      ),
    })),
  }));
}

function syncProjectsFromDom() {
  const projectSections = Array.from(
    elements.projectsAdminList.querySelectorAll("[data-project-index]")
  );

  state.content.projects = projectSections.map((projectEl, projectIndex) => ({
    id: state.content.projects[projectIndex]?.id || createId("project"),
    title: projectEl.querySelector("[data-project-title]")?.value.trim() || `Project ${projectIndex + 1}`,
    summary: projectEl.querySelector("[data-project-summary]")?.value.trim() || "",
    description: projectEl.querySelector("[data-project-description]")?.value.trim() || "",
    tags: splitCommaList(projectEl.querySelector("[data-project-tags]")?.value || ""),
    icon: projectEl.querySelector("[data-project-icon]")?.value.trim() || "fa-solid fa-laptop-code",
    image_url: projectEl.querySelector("[data-project-image-url]")?.value.trim() || "",
    image_alt: projectEl.querySelector("[data-project-image-alt]")?.value.trim() || "",
    link_url: projectEl.querySelector("[data-project-link-url]")?.value.trim() || "",
    link_label: projectEl.querySelector("[data-project-link-label]")?.value.trim() || "View Project",
  }));
}

function syncStateFromDom() {
  syncProfileFromDom();
  syncSkillsFromDom();
  syncProjectsFromDom();
}

function renderAllEditors() {
  renderProfileFields();
  renderSkillsEditor();
  renderProjectsEditor();
}

function normalizeFilename(name) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  return cleaned.replace(/-+/g, "-");
}

async function uploadAsset(file, folder) {
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "";
  const fileName = normalizeFilename(file.name.replace(/\.[^.]+$/, ""));
  const suffix = extension ? `.${extension}` : "";
  const filePath = `${folder}/${Date.now()}-${fileName}${suffix}`;

  const { error } = await supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function handleProfileImageUpload(file) {
  if (!file) return;

  syncStateFromDom();
  showStatus("Uploading profile image...", "info");

  const publicUrl = await uploadAsset(file, "profile");
  state.content.profile.profile_image_url = publicUrl;
  state.content.profile.profile_image_alt =
    state.content.profile.profile_image_alt || state.content.profile.full_name;
  renderProfileFields();
  showStatus("Profile image uploaded. Save changes to publish it.", "success");
}

async function handleCvUpload(file) {
  if (!file) return;

  syncStateFromDom();
  showStatus("Uploading CV...", "info");

  const publicUrl = await uploadAsset(file, "cv");
  state.content.profile.cv_url = publicUrl;
  renderProfileFields();
  showStatus("CV uploaded. Save changes to publish it.", "success");
}

async function handleProjectImageUpload(projectIndex, file) {
  if (!file) return;

  syncStateFromDom();
  showStatus(`Uploading image for project ${projectIndex + 1}...`, "info");

  const publicUrl = await uploadAsset(file, "projects");
  state.content.projects[projectIndex].image_url = publicUrl;
  state.content.projects[projectIndex].image_alt =
    state.content.projects[projectIndex].image_alt || state.content.projects[projectIndex].title;
  renderProjectsEditor();
  showStatus("Project image uploaded. Save changes to publish it.", "success");
}

async function saveContent() {
  syncStateFromDom();
  setBusy(state.saveButtons, true, "Saving...");
  clearStatus();

  try {
    const payload = normalizePortfolioContent(state.content);

    const { error } = await supabase.from("site_content").upsert(
      {
        slug: SITE_CONTENT_SLUG,
        profile: payload.profile,
        skills: payload.skills,
        projects: payload.projects,
      },
      {
        onConflict: "slug",
      }
    );

    if (error) {
      throw error;
    }

    state.content = payload;
    renderAllEditors();
    showStatus("Portfolio content saved successfully.", "success");
  } catch (error) {
    showStatus(error.message || "Failed to save content.", "error");
  } finally {
    setBusy(state.saveButtons, false);
  }
}

async function signOut() {
  await supabase.auth.signOut();
  showStatus("Signed out.", "success");
}

function bindDynamicActions() {
  elements.addSkillGroupBtn.addEventListener("click", () => {
    syncStateFromDom();
    state.content.skills.push({
      id: createId("skill-group"),
      category: "New Category",
      description: "Short description for this category.",
      icon: "fa-solid fa-code",
      items: [{ id: createId("skill-item"), name: "New Skill", percent: 50 }],
    });
    renderSkillsEditor();
  });

  elements.skillsAdminList.addEventListener("click", (event) => {
    const removeGroupBtn = event.target.closest("[data-remove-skill-group]");
    if (removeGroupBtn) {
      syncStateFromDom();
      const groupIndex = Number(removeGroupBtn.dataset.removeSkillGroup);
      state.content.skills.splice(groupIndex, 1);
      renderSkillsEditor();
      return;
    }

    const addSkillItemBtn = event.target.closest("[data-add-skill-item]");
    if (addSkillItemBtn) {
      syncStateFromDom();
      const groupIndex = Number(addSkillItemBtn.dataset.addSkillItem);
      state.content.skills[groupIndex].items.push({
        id: createId("skill-item"),
        name: "New Skill",
        percent: 50,
      });
      renderSkillsEditor();
      return;
    }

    const removeSkillItemBtn = event.target.closest("[data-remove-skill-item]");
    if (removeSkillItemBtn) {
      syncStateFromDom();
      const groupIndex = Number(removeSkillItemBtn.dataset.removeSkillItem);
      const itemIndex = Number(removeSkillItemBtn.dataset.itemIndex);
      state.content.skills[groupIndex].items.splice(itemIndex, 1);
      renderSkillsEditor();
    }
  });

  elements.addProjectBtn.addEventListener("click", () => {
    syncStateFromDom();
    state.content.projects.push({
      id: createId("project"),
      title: "New Project",
      summary: "Short project summary.",
      description: "Longer project preview description.",
      tags: ["New"],
      icon: "fa-solid fa-laptop-code",
      image_url: "./src/assets/images/preview.png",
      image_alt: "New project preview",
      link_url: "https://github.com/Mikecyberdev",
      link_label: "View Project",
    });
    renderProjectsEditor();
  });

  elements.projectsAdminList.addEventListener("click", (event) => {
    const removeProjectBtn = event.target.closest("[data-remove-project]");
    if (!removeProjectBtn) return;

    syncStateFromDom();
    const projectIndex = Number(removeProjectBtn.dataset.removeProject);
    state.content.projects.splice(projectIndex, 1);
    renderProjectsEditor();
  });

  elements.projectsAdminList.addEventListener("change", async (event) => {
    const uploadInput = event.target.closest("[data-project-image-upload]");
    if (!uploadInput) return;

    const projectIndex = Number(uploadInput.dataset.projectImageUpload);
    const file = uploadInput.files?.[0];
    if (!file) return;

    try {
      await handleProjectImageUpload(projectIndex, file);
    } catch (error) {
      showStatus(error.message || "Project image upload failed.", "error");
    } finally {
      uploadInput.value = "";
    }
  });

  elements.profileImageFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await handleProfileImageUpload(file);
    } catch (error) {
      showStatus(error.message || "Profile image upload failed.", "error");
    } finally {
      event.target.value = "";
    }
  });

  elements.cvFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await handleCvUpload(file);
    } catch (error) {
      showStatus(error.message || "CV upload failed.", "error");
    } finally {
      event.target.value = "";
    }
  });

  elements.saveTopBtn.addEventListener("click", saveContent);
  elements.saveBottomBtn.addEventListener("click", saveContent);
  elements.signOutBtn.addEventListener("click", signOut);
  elements.loginSignOutBtn.addEventListener("click", signOut);
}

async function handleAuthenticatedState(session) {
  const email = session?.user?.email || "Authenticated";

  try {
    const isAdmin = await ensureAdminAccess();

    if (!isAdmin) {
      showLoginPanel({ allowSessionSignOut: true });
      showStatus(
        "This account is signed in but not listed in the admin_users table yet. Update supabase/setup.sql with your email and run it in the SQL editor.",
        "error"
      );
      return;
    }

    elements.loginSignOutBtn.classList.add("hidden");
    state.content = await loadPortfolioContent();
    renderAllEditors();
    showDashboard(email);
    clearStatus();
  } catch (error) {
    showLoginPanel({ allowSessionSignOut: true });
    showStatus(error.message || "Could not verify admin access.", "error");
  }
}

async function initializeSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    await handleAuthenticatedState(session);
    return;
  }

  showLoginPanel();
}

document.addEventListener("DOMContentLoaded", async () => {
  bindStaticElements();
  bindDynamicActions();
  showLoginPanel();

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus();

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      showStatus("You appear to be offline. Reconnect to the internet and try again.", "error");
      return;
    }

    setBusy([elements.loginSubmitBtn], true, "Signing In...");

    try {
      const isSupabaseReachable = await canReachSupabase();

      if (!isSupabaseReachable) {
        throw new Error(
          "Cannot reach Supabase from this browser right now. Check Brave Shields, VPN, firewall, or your network and try again."
        );
      }

      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: elements.loginEmail.value.trim(),
          password: elements.loginPassword.value,
        }),
        LOGIN_TIMEOUT_MS,
        "Login timed out. Supabase is taking too long to respond. Check your network and try again."
      );

      if (error) {
        throw error;
      }

      showStatus("Signed in successfully.", "success");
      elements.loginPassword.value = "";
    } catch (error) {
      showStatus(getSignInErrorMessage(error), "error");
    } finally {
      setBusy([elements.loginSubmitBtn], false);
    }
  });

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session) {
      showLoginPanel();
      elements.loginForm.reset();
      state.content = cloneDefaultPortfolioContent();
      return;
    }

    await handleAuthenticatedState(session);
  });

  await initializeSession();
});
