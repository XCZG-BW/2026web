/* =========================================================
   飞盘少年 · 站点通用脚本
   - 吸顶阴影
   - 移动端抽屉
   - 「特色模块」下拉（项为真实链接）
   - 依据 body[data-page] 自动高亮当前页
   - 滚动显现
   ========================================================= */
(function () {
  "use strict";

  var header = document.getElementById("header");
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  var moduleItem = document.getElementById("moduleItem");
  var moduleToggle = document.getElementById("moduleToggle");
  var moduleMenu = document.getElementById("moduleMenu");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* 静态预览（截图 / 打印）时直接展示所有内容 */
  var staticMode = /[?&]static=1/.test(window.location.search);
  var page = document.body.getAttribute("data-page") || "home";

  /* ---------- 1. 吸顶阴影 ---------- */
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("is-stuck", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- 2. 移动端抽屉 ---------- */
  var setNav = function (open) {
    document.body.classList.toggle("nav-open", open);
    if (!burger) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    if (!open) setModuleMenu(false);
  };

  if (burger) {
    burger.addEventListener("click", function () {
      setNav(!document.body.classList.contains("nav-open"));
    });
  }

  if (nav) {
    nav.addEventListener("click", function (e) {
      if (e.target.closest("#moduleItem")) return;
      if (e.target.closest(".nav__link")) setNav(false);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (document.body.classList.contains("nav-open")) {
      setNav(false);
      if (burger) burger.focus();
      return;
    }
    if (moduleItem && moduleItem.classList.contains("is-open")) {
      setModuleMenu(false);
      if (moduleToggle) moduleToggle.focus();
    }
  });

  document.addEventListener("click", function (e) {
    if (document.body.classList.contains("nav-open")) {
      if (!e.target.closest("#nav") && !e.target.closest("#burger")) setNav(false);
    }
    if (!moduleItem || !moduleItem.classList.contains("is-open")) return;
    if (e.target.closest("#moduleItem")) return;
    setModuleMenu(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900 && document.body.classList.contains("nav-open")) {
      setNav(false);
    }
  });

  /* ---------- 3. 特色模块下拉 ---------- */
  function setModuleMenu(open) {
    if (!moduleItem || !moduleToggle) return;
    moduleItem.classList.toggle("is-open", open);
    moduleToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (moduleToggle) {
    moduleToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setModuleMenu(!moduleItem.classList.contains("is-open"));
    });

    moduleToggle.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown") return;
      e.preventDefault();
      setModuleMenu(true);
      var first = moduleMenu && moduleMenu.querySelector(".submenu__item");
      if (first) first.focus();
    });
  }

  if (moduleMenu) {
    moduleMenu.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(
        moduleMenu.querySelectorAll(".submenu__item")
      );
      var i = items.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(i + 1) % items.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(i - 1 + items.length) % items.length].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1].focus();
      }
    });
  }

  /* ---------- 4. 当前页高亮 ---------- */
  function syncActive() {
    var inModules = page.indexOf("module-") === 0;

    Array.prototype.forEach.call(
      document.querySelectorAll("[data-nav]"),
      function (el) {
        var key = el.getAttribute("data-nav");
        var exact = key === page;
        var active = exact || (key === "modules" && inModules);
        el.classList.toggle("is-active", active);
        if (exact) {
          el.setAttribute("aria-current", "page");
        } else {
          el.removeAttribute("aria-current");
        }
      }
    );

    Array.prototype.forEach.call(
      document.querySelectorAll(".submenu__item"),
      function (el) {
        var on = el.getAttribute("data-nav") === page;
        el.classList.toggle("is-selected", on);
        el.setAttribute("aria-checked", on ? "true" : "false");
      }
    );

    if (moduleToggle && inModules) {
      moduleToggle.setAttribute(
        "aria-label",
        "特色模块（当前：" + (page === "module-1" ? "特色模块1" : "特色模块2") + "）"
      );
    }
  }

  syncActive();

  /* ---------- 5. 滚动显现 ---------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (staticMode || reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealItems.forEach(function (el) {
      io.observe(el);
    });
  }
})();
