/* =========================================================
   飞盘少年 · 飞盘规则课堂 —— 交互脚本
   本页为「特色模块1」二级页面；顶部导航不负责本页内跳转
   ========================================================= */
(function () {
  "use strict";

  var header = document.getElementById("header");
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* 静态预览（截图 / 打印）时直接展示所有内容 */
  var staticMode = /[?&]static=1/.test(window.location.search);

  /* ---------- 1. 顶部导航吸顶阴影 ---------- */
  var onScroll = function () {
    if (window.scrollY > 8) {
      header.classList.add("is-stuck");
    } else {
      header.classList.remove("is-stuck");
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- 2. 移动端菜单 ---------- */
  var setNav = function (open) {
    document.body.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    if (!open) setModuleMenu(false);
  };

  burger.addEventListener("click", function () {
    setNav(!document.body.classList.contains("nav-open"));
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("#moduleItem")) return;
    if (e.target.closest(".nav__link")) setNav(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      setNav(false);
      burger.focus();
    }
  });

  document.addEventListener("click", function (e) {
    if (!document.body.classList.contains("nav-open")) return;
    if (e.target.closest("#nav") || e.target.closest("#burger")) return;
    setNav(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900 && document.body.classList.contains("nav-open")) {
      setNav(false);
    }
  });

  /* ---------- 3. 特色模块：下拉选择 ---------- */
  var moduleItem = document.getElementById("moduleItem");
  var moduleToggle = document.getElementById("moduleToggle");
  var moduleMenu = document.getElementById("moduleMenu");
  var moduleOptions = moduleMenu
    ? Array.prototype.slice.call(moduleMenu.querySelectorAll(".submenu__item"))
    : [];

  function setModuleMenu(open, focusFirst) {
    if (!moduleItem) return;
    moduleItem.classList.toggle("is-open", open);
    moduleToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open && focusFirst && moduleOptions.length) moduleOptions[0].focus();
  }

  function selectModule(option) {
    moduleOptions.forEach(function (item) {
      item.classList.remove("is-selected");
      item.setAttribute("aria-checked", "false");
    });
    option.classList.add("is-selected");
    option.setAttribute("aria-checked", "true");
    moduleToggle.setAttribute(
      "aria-label",
      "特色模块（当前：" + option.dataset.module + "）"
    );
    setModuleMenu(false);
    moduleToggle.focus();
    /* 需要真正跳转到对应模块页时，在这里接上：
       location.href = "/modules/" + option.dataset.module + ".html"; */
  }

  if (moduleToggle && moduleMenu) {
    moduleToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setModuleMenu(!moduleItem.classList.contains("is-open"));
    });

    moduleToggle.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setModuleMenu(true, true);
      }
    });

    moduleOptions.forEach(function (option) {
      option.addEventListener("click", function () {
        selectModule(option);
        if (window.innerWidth <= 900) setNav(false);
      });
    });

    moduleMenu.addEventListener("keydown", function (e) {
      var index = moduleOptions.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moduleOptions[(index + 1) % moduleOptions.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moduleOptions[(index - 1 + moduleOptions.length) % moduleOptions.length].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        moduleOptions[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        moduleOptions[moduleOptions.length - 1].focus();
      } else if (e.key === "Escape") {
        setModuleMenu(false);
        moduleToggle.focus();
      }
    });

    /* 点击外部关闭 */
    document.addEventListener("click", function (e) {
      if (!moduleItem.classList.contains("is-open")) return;
      if (e.target.closest("#moduleItem")) return;
      setModuleMenu(false);
    });

    /* 桌面端失焦后收起 */
    document.addEventListener("focusin", function (e) {
      if (!moduleItem.classList.contains("is-open")) return;
      if (e.target.closest("#moduleItem")) return;
      setModuleMenu(false);
    });
  }

  /* ---------- 4. 站内其他页面的占位链接 ---------- */
  Array.prototype.forEach.call(
    document.querySelectorAll("[data-placeholder]"),
    function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
      });
    }
  );

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
