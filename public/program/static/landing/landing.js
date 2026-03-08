(() => {
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  const initTabs = () => {
    const tablists = Array.from(document.querySelectorAll("[role='tablist']"));
    tablists.forEach((tablist) => {
      const tabs = Array.from(tablist.querySelectorAll("[role='tab']"));
      if (!tabs.length) return;

      const indicator = tablist.querySelector("[class*='Tabs_tab_selected_background']");
      const tabsetRoot = tablist.closest(".Research_element__yYMTO") || tablist.parentElement || document;
      const tabPanels = Array.from(tabsetRoot.querySelectorAll("[role='tabpanel']"));

      const activate = (tab) => {
        tabs.forEach((t) => {
          const isActive = t === tab;
          t.setAttribute("aria-selected", isActive ? "true" : "false");
          t.setAttribute("tabindex", isActive ? "0" : "-1");
          const panelId = t.getAttribute("aria-controls");
          if (!panelId) return;
          const panel = document.getElementById(panelId);
          if (!panel) return;
          // Some mirrored panels use the native `hidden` attribute.
          // If we only change display, hidden panels remain invisible.
          panel.hidden = !isActive;
          if (isActive) {
            panel.removeAttribute("hidden");
          } else {
            panel.setAttribute("hidden", "");
          }
          panel.style.display = isActive ? "block" : "none";
          panel.setAttribute("aria-hidden", isActive ? "false" : "true");
        });

        // Sync panels in the same tabset root (Research tabs).
        if (tabPanels.length) {
          tabPanels.forEach((panel) => {
            const ownedByTab = panel.getAttribute("aria-labelledby") === tab.id;
            const isActivePanel = ownedByTab;
            panel.hidden = !isActivePanel;
            if (isActivePanel) {
              panel.removeAttribute("hidden");
            } else {
              panel.setAttribute("hidden", "");
            }
            panel.style.display = isActivePanel ? "block" : "none";
            panel.setAttribute("aria-hidden", isActivePanel ? "false" : "true");
          });
        }

        if (indicator) {
          const rect = tab.getBoundingClientRect();
          const parent = tablist.getBoundingClientRect();
          const left = rect.left - parent.left;
          indicator.style.width = `${rect.width}px`;
          indicator.style.transform = `translateX(${left}px)`;
        }
      };

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => activate(tab));
        tab.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const currentIndex = tabs.indexOf(tab);
          if (currentIndex === -1) return;
          const nextIndex = event.key === "ArrowRight"
            ? (currentIndex + 1) % tabs.length
            : (currentIndex - 1 + tabs.length) % tabs.length;
          const nextTab = tabs[nextIndex];
          if (nextTab) {
            nextTab.focus();
            activate(nextTab);
          }
        });
      });

      const initial = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
      activate(initial);
    });
  };

  const initResearchTabs = () => {
    const research = document.querySelector(".Research_element__yYMTO");
    if (!research) return;

    const existingTablist = research.querySelector("[role='tablist']");
    const existingPanels = Array.from(research.querySelectorAll("[role='tabpanel']"));
    if (!existingTablist || !existingPanels.length) return;

    const tabButtons = Array.from(existingTablist.querySelectorAll("[role='tab']"));
    if (!tabButtons.length) return;

    const tabsData = tabButtons.map((btn) => {
      const panelId = btn.getAttribute("aria-controls");
      const panel = panelId ? research.querySelector(`#${panelId}`) : null;
      return {
        id: btn.id || `research-tab-${panelId}`,
        label: btn.textContent.trim(),
        panelId: panelId || "",
        panel: panel,
      };
    }).filter((t) => t.panel);

    if (!tabsData.length) return;

    const tabsDataNormalized = tabsData.map((tab, index) => ({
      id: tab.id || `research-tab-${index}`,
      label: tab.label,
      html: tab.panel ? tab.panel.innerHTML : "",
    }));

    const root = document.createElement("div");
    root.className = "qrt-root";

    const tablist = document.createElement("div");
    tablist.className = "qrt-tabs";
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "Research categories");

    const indicator = document.createElement("div");
    indicator.className = "qrt-indicator";
    indicator.setAttribute("aria-hidden", "true");
    tablist.appendChild(indicator);

    const panelsWrap = document.createElement("div");
    panelsWrap.className = "qrt-panels";

    tabsDataNormalized.forEach((tab, index) => {
      const button = document.createElement("button");
      button.className = "qrt-tab";
      button.id = tab.id;
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", `qrt-panel-${index}`);
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");
      button.setAttribute("tabindex", index === 0 ? "0" : "-1");
      button.textContent = tab.label;
      tablist.appendChild(button);

      const panel = document.createElement("div");
      panel.className = "qrt-panel";
      panel.id = `qrt-panel-${index}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.hidden = index !== 0;
      panel.setAttribute("aria-hidden", index === 0 ? "false" : "true");
      panel.style.display = index === 0 ? "block" : "none";
      panel.innerHTML = tab.html;
      panelsWrap.appendChild(panel);
    });

    const bottom = research.querySelector(".Research_element_bottom__KtD73");
    if (!bottom) return;
    bottom.innerHTML = "";
    root.appendChild(tablist);
    root.appendChild(panelsWrap);
    bottom.appendChild(root);

    const tabs = Array.from(tablist.querySelectorAll("[role='tab']"));
    const panels = Array.from(panelsWrap.querySelectorAll("[role='tabpanel']"));

    const activate = (tab) => {
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.setAttribute("aria-selected", isActive ? "true" : "false");
        t.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      const targetPanelId = tab.getAttribute("aria-controls");
      panels.forEach((panel) => {
        const isActive = targetPanelId && panel.id === targetPanelId;
        panel.hidden = !isActive;
        panel.setAttribute("aria-hidden", isActive ? "false" : "true");
        panel.style.display = isActive ? "block" : "none";
      });

      if (indicator) {
        const rect = tab.getBoundingClientRect();
        const parent = tablist.getBoundingClientRect();
        const left = rect.left - parent.left;
        indicator.style.width = `${rect.width}px`;
        indicator.style.transform = `translateX(${left}px)`;
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activate(tab));
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const currentIndex = tabs.indexOf(tab);
        const nextIndex = event.key === "ArrowRight"
          ? (currentIndex + 1) % tabs.length
          : (currentIndex - 1 + tabs.length) % tabs.length;
        const nextTab = tabs[nextIndex];
        if (nextTab) {
          nextTab.focus();
          activate(nextTab);
        }
      });
    });

    activate(tabs[0]);
  };

  const initBeforeAfter = () => {
    const legacy = Array.from(document.querySelectorAll(".qa-beforeafter, .qa-beforeafter-native"));
    legacy.forEach((slider) => {
      const before = slider.querySelector(".qa-beforeafter__before") || slider.querySelector(".BeforeAfter_before_picture__viOvB");
      const range = slider.querySelector(".qa-beforeafter__range");
      const handle = slider.querySelector(".qa-beforeafter__handle") || slider.querySelector(".BeforeAfter_divider__h4FKT");
      if (!before || !range || !handle) return;

      const update = () => {
        const value = Number(range.value);
        before.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
        handle.style.left = `${value}%`;
      };

      range.addEventListener("input", update);
      update();
    });

  };


  const initAnnouncement = () => {
    const closeButtons = Array.from(document.querySelectorAll("[class*='Announcement_close']"));
    closeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const wrapper = button.closest("[class*='Announcement_announcement']");
        if (wrapper) wrapper.style.display = "none";
      });
    });
  };

  const initFaq = () => {
    const $ = window.jQuery;
    const faq = document.getElementById("faq");
    if (!faq) return;

    const sourceWrap = faq.querySelector(".FAQ_collapsibles__S8uuo");
    if (!sourceWrap) return;

    const groups = [];
    Array.from(sourceWrap.children).forEach((groupEl) => {
      if (!groupEl.className.includes("FAQ_collapsible__l5LvW")) return;

      const groupTitleEl = groupEl.querySelector(".FAQ_collapsible_header_title__k2Z1Y");
      const itemsWrap = groupEl.querySelector(".FAQ_content_collapsibles__Iwuqz");
      if (!groupTitleEl || !itemsWrap) return;

      const items = [];
      Array.from(itemsWrap.children).forEach((itemEl) => {
        if (!itemEl.className.includes("FAQ_content_collapsible__W3w64")) return;
        const qEl = itemEl.querySelector(".FAQ_content_collapsible_header_title__t08u4");
        const aEl = itemEl.querySelector(".FAQ_content_collapsible_content__73HDb");
        if (!qEl || !aEl) return;
        items.push({
          question: qEl.textContent.trim(),
          answerHtml: aEl.innerHTML.trim(),
        });
      });

      if (!items.length) return;
      groups.push({
        title: groupTitleEl.textContent.trim(),
        items,
      });
    });

    if (!groups.length) return;

    const html = groups
      .map((group, groupIndex) => {
        const itemHtml = group.items
          .map(
            (item, itemIndex) => `
            <div class="qf-item">
              <button class="qf-item-button" type="button" aria-expanded="false" aria-controls="qf-item-panel-${groupIndex + 1}-${itemIndex + 1}">
                <span>${item.question}</span>
                <span class="qf-icon" aria-hidden="true"></span>
              </button>
              <div class="qf-item-panel" id="qf-item-panel-${groupIndex + 1}-${itemIndex + 1}" aria-hidden="true">
                <div class="qf-answer">${item.answerHtml}</div>
              </div>
            </div>`
          )
          .join("");

        return `
        <section class="qf-group">
          <button class="qf-group-button" type="button" aria-expanded="false" aria-controls="qf-group-panel-${groupIndex + 1}">
            <span>${group.title}</span>
            <span class="qf-icon" aria-hidden="true"></span>
          </button>
          <div class="qf-group-panel" id="qf-group-panel-${groupIndex + 1}" aria-hidden="true">
            ${itemHtml}
          </div>
        </section>`;
      })
      .join("");

    sourceWrap.innerHTML = `<div class="qf-root">${html}</div>`;

    const animateOpen = (el) => {
      if ($) {
        $(el).stop(true, true).slideDown(180);
      } else {
        el.style.display = "block";
      }
    };
    const animateClose = (el) => {
      if ($) {
        $(el).stop(true, true).slideUp(180);
      } else {
        el.style.display = "none";
      }
    };

    const setExpanded = (button, panel, expanded) => {
      button.setAttribute("aria-expanded", expanded ? "true" : "false");
      panel.setAttribute("aria-hidden", expanded ? "false" : "true");
      button.classList.toggle("is-open", expanded);
      if (expanded) {
        animateOpen(panel);
      } else {
        animateClose(panel);
      }
    };

    const groupButtons = Array.from(sourceWrap.querySelectorAll(".qf-group-button"));
    groupButtons.forEach((groupButton) => {
      const groupPanel = document.getElementById(groupButton.getAttribute("aria-controls"));
      if (!groupPanel) return;
      setExpanded(groupButton, groupPanel, false);

      groupButton.addEventListener("click", () => {
        const willOpen = groupButton.getAttribute("aria-expanded") !== "true";

        groupButtons.forEach((otherGroupButton) => {
          const otherGroupPanel = document.getElementById(
            otherGroupButton.getAttribute("aria-controls")
          );
          if (!otherGroupPanel) return;
          setExpanded(otherGroupButton, otherGroupPanel, false);
        });

        if (willOpen) {
          setExpanded(groupButton, groupPanel, true);
        }
      });

      const itemButtons = Array.from(groupPanel.querySelectorAll(".qf-item-button"));
      itemButtons.forEach((itemButton) => {
        const itemPanel = document.getElementById(itemButton.getAttribute("aria-controls"));
        if (!itemPanel) return;
        setExpanded(itemButton, itemPanel, false);

        itemButton.addEventListener("click", () => {
          const willOpen = itemButton.getAttribute("aria-expanded") !== "true";
          itemButtons.forEach((otherItemButton) => {
            const otherItemPanel = document.getElementById(
              otherItemButton.getAttribute("aria-controls")
            );
            if (!otherItemPanel) return;
            setExpanded(otherItemButton, otherItemPanel, false);
          });

          if (willOpen) {
            setExpanded(itemButton, itemPanel, true);
          }
        });
      });
    });
  };

  const initAestheticsTests = () => {
    const blocks = Array.from(document.querySelectorAll(".AestheticsTests_collapsible__uzmw2"));
    if (!blocks.length) return;

    const getHeader = (block) =>
      Array.from(block.children).find(
        (el) => typeof el.className === "string" && el.className.includes("AestheticsTests_collapsible_header__PoSYX")
      );

    const getPanel = (block) =>
      Array.from(block.children).find(
        (el) => typeof el.className === "string" && el.className.includes("AestheticsTests_collapsible_container__InNxY")
      );

    const setOpen = (block, open) => {
      const header = getHeader(block);
      const panel = getPanel(block);
      if (!header || !panel) return;

      block.classList.toggle("is-open", open);
      header.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      panel.hidden = !open;

      // Override any legacy CSS rules from mirrored styles.
      panel.style.setProperty("display", open ? "block" : "none", "important");
      panel.style.setProperty("height", open ? "auto" : "0", "important");
      panel.style.setProperty("max-height", open ? "none" : "0", "important");
      panel.style.setProperty("overflow", open ? "visible" : "hidden", "important");
      panel.style.setProperty("opacity", open ? "1" : "0", "important");
    };

    blocks.forEach((block) => {
      const header = getHeader(block);
      if (!header) return;

      header.setAttribute("role", "button");
      header.setAttribute("tabindex", "0");
      header.setAttribute("aria-expanded", "false");
      setOpen(block, false);

      header.addEventListener("click", () => {
        const willOpen = !block.classList.contains("is-open");
        blocks.forEach((otherBlock) => setOpen(otherBlock, false));
        if (willOpen) setOpen(block, true);
      });

      header.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        header.click();
      });
    });
  };

  const initNewsCoverage = () => {
    const section = document.querySelector(".NewsCoverage_element__A_q5J");
    if (!section) return;

    const logos = Array.from(section.querySelectorAll("img"))
      .map((img) => ({
        src: img.getAttribute("src"),
        alt: img.getAttribute("alt") || "",
        title: img.getAttribute("title") || "",
      }))
      .filter((logo) => logo.src);

    if (!logos.length) return;

    const track = document.createElement("div");
    track.className = "ncl-track";
    logos.forEach((logo) => {
      const item = document.createElement("div");
      item.className = "ncl-item";
      const image = document.createElement("img");
      image.src = logo.src;
      image.alt = logo.alt;
      image.title = logo.title;
      image.loading = "lazy";
      item.appendChild(image);
      track.appendChild(item);
    });

    section.innerHTML = "";
    const root = document.createElement("div");
    root.className = "ncl-root";
    root.appendChild(track);
    section.appendChild(root);
  };

  const initFeaturesGridIcons = () => {
    const features = Array.from(document.querySelectorAll(".FeaturesGrid_feature__uju4x"));
    if (!features.length) return;

    const icons = [
      `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="fg-icon">
        <circle cx="24" cy="24" r="18" stroke="#9AAEB5" stroke-width="2"/>
        <path d="M24 14v20M14 24h20" stroke="#6F858E" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="fg-icon fg-icon--delay-1">
        <path d="M24 6l14 6v9c0 10-6.5 16.5-14 21-7.5-4.5-14-11-14-21v-9l14-6z" stroke="#9AAEB5" stroke-width="2" fill="none"/>
        <path d="M18 24l4 4 8-8" stroke="#6F858E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="fg-icon fg-icon--delay-2">
        <circle cx="24" cy="18" r="8" stroke="#9AAEB5" stroke-width="2"/>
        <path d="M10 40c3-7 10-10 14-10s11 3 14 10" stroke="#6F858E" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="fg-icon fg-icon--delay-3">
        <path d="M14 34h20M18 34c0-6 12-6 12 0" stroke="#6F858E" stroke-width="2" stroke-linecap="round"/>
        <path d="M20 8h8l2 6-4 8h-4l-4-8 2-6z" stroke="#9AAEB5" stroke-width="2" stroke-linejoin="round"/>
      </svg>`
    ];

    features.forEach((feature, index) => {
      const lottie = feature.querySelector(".FeaturesGrid_feature_lottie__Gcypd");
      if (!lottie) return;
      let slot = lottie.querySelector("div");
      if (!slot) {
        slot = document.createElement("div");
        lottie.appendChild(slot);
      }
      slot.innerHTML = icons[index % icons.length];
    });
  };

  const initImagePlaceholders = () => {
    const attachPlaceholder = (img, placeholder) => {
      const parent = img.parentElement || placeholder.parentElement;
      if (parent && !parent.classList.contains("img-placeholder-wrap")) {
        parent.classList.add("img-placeholder-wrap");
      }

      const markLoaded = () => {
        placeholder.setAttribute("data-loaded", "true");
        placeholder.removeAttribute("data-error");
      };

      const markError = () => {
        placeholder.setAttribute("data-error", "true");
        placeholder.removeAttribute("data-loaded");
      };

      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
      } else {
        img.addEventListener("load", markLoaded, { once: true });
        img.addEventListener("error", markError, { once: true });
      }
    };

    const placeholders = Array.from(document.querySelectorAll(".skeleton_img"));
    placeholders.forEach((placeholder) => {
      placeholder.classList.add("img-placeholder");
      const img = placeholder.parentElement
        ? placeholder.parentElement.querySelector("img")
        : null;
      if (img) {
        attachPlaceholder(img, placeholder);
      }
    });

    const images = Array.from(document.querySelectorAll("img"));
    images.forEach((img) => {
      const parent = img.parentElement;
      if (!parent) return;
      const existing = parent.querySelector(".skeleton_img");
      if (existing) return;

      const placeholder = document.createElement("div");
      placeholder.className = "skeleton_img img-placeholder";
      parent.appendChild(placeholder);
      attachPlaceholder(img, placeholder);
    });
  };

  const safeInit = (name, fn) => {
    try {
      fn();
    } catch (error) {
      console.error(`[landing] init failed: ${name}`, error);
    }
  };

  onReady(() => {
    safeInit("tabs", initTabs);
    // safeInit("researchTabs", initResearchTabs);
    safeInit("beforeAfter", initBeforeAfter);
    safeInit("announcement", initAnnouncement);
    safeInit("aestheticsTests", initAestheticsTests);
    safeInit("newsCoverage", initNewsCoverage);
    safeInit("faq", initFaq);
    safeInit("imagePlaceholders", initImagePlaceholders);
    safeInit("featuresGridIcons", initFeaturesGridIcons);
  });
})();
