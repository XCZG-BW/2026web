/* =========================================================
   首页 · 首屏「上拉进入 about.html」
   ---------------------------------------------------------
   手势只作用在首屏浮动的「上拉把手」上，页面其余位置滚动照常：
     触屏 / 鼠标拖动：在把手上向上拖 → 过阈值松手即进入
     滚轮：指针停在把手上、页面还在顶部时向下滚 → 累积拉动距离
   防误触：必须从把手内起手、单次连续累积超过阈值、拖拽后吞掉
   冒泡出来的 click、提交后进入冷却；滚过首屏把手自动收起。
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 参数（与 home.css 的 :root 保持一致） ---------- */
  var CFG = {
    threshold: 140,        // 拉动多少 px 算“意图进入”
    maxPull: 240,          // 拉动距离上限
    wheelGain: 0.9,        // 滚轮 deltaY 折算成拉动距离的系数
    wheelIdle: 220,        // 滚轮停手多久后判定（ms）
    dragSlop: 6,           // 超过多少 px 才算拖拽（用于抑制 click）
    hideAfter: 120,        // 页面滚过多少 px 收起把手
    commitCooldown: 1200,  // 提交后冷却（ms）
    fallbackDelay: 300     // 不支持 View Transitions 时的兜底时长
  };

  var root = document.documentElement;
  var zone = document.getElementById("homePull");
  if (!zone) return;

  var link = zone.querySelector("[data-pull-link]") || zone.querySelector("a");
  if (!link) return;
  var target = link.getAttribute("href") || "about.html";

  /* CSS 里的参数优先 */
  var cssVar = function (name) {
    var v = parseFloat(getComputedStyle(root).getPropertyValue(name));
    return isNaN(v) ? 0 : v;
  };
  var t = cssVar("--home-pull-threshold");
  var m = cssVar("--home-pull-max");
  if (t > 0) CFG.threshold = t;
  if (m >= t && m > 0) CFG.maxPull = m;

  var staticMode = /[?&]static=1/.test(window.location.search);
  if (staticMode) {
    zone.classList.add("is-hidden"); /* 截图 / 打印时不出现浮动把手 */
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var pull = 0;
  var dragging = false;
  var startY = 0;
  var moved = false;
  var wheelAcc = 0;
  var wheelTimer = 0;
  var committed = false;
  var cooldownUntil = 0;
  var suppressClick = false;

  function setPull(v) {
    pull = Math.max(0, Math.min(CFG.maxPull, v));
    var p = Math.min(1, pull / CFG.threshold);
    root.style.setProperty("--pull", pull.toFixed(1) + "px");
    root.style.setProperty("--pull-p", p.toFixed(3));
    root.classList.toggle("is-pulling", pull > 2);
    root.classList.toggle("is-armed", p >= 1);
    link.setAttribute(
      "aria-label",
      p >= 1 ? "松手进入「俱乐部介绍」" : "上拉或点击进入「俱乐部介绍」"
    );
  }

  function reset() {
    setPull(0);
    wheelAcc = 0;
  }

  function commit() {
    if (committed) return;
    committed = true;
    cooldownUntil = Date.now() + CFG.commitCooldown;
    root.classList.add("is-committing");
    root.classList.remove("is-armed");

    /* 现代浏览器：配合 transitions.css 的 @view-transition，跳转自带过渡 */
    if (document.startViewTransition) {
      requestAnimationFrame(function () {
        window.location.href = target;
      });
      return;
    }

    window.setTimeout(function () {
      window.location.href = target;
    }, CFG.fallbackDelay);
  }

  function release(allowCommit) {
    if (!dragging) return;
    dragging = false;
    if (allowCommit && pull >= CFG.threshold) commit();
    else reset();
    if (moved) suppressClick = true;
    moved = false;
  }

  /* ---------- 滚过首屏收起 ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (committed) return;
      zone.classList.toggle("is-hidden", window.scrollY > CFG.hideAfter);
    });
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (reduceMotion) return; /* 减弱动效：只留按钮，不绑手势 */

  /* ---------- 指针（触屏 + 鼠标） ---------- */
  zone.addEventListener("pointerdown", function (e) {
    if (committed || Date.now() < cooldownUntil) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    dragging = true;
    moved = false;
    startY = e.clientY;
  });

  zone.addEventListener("pointermove", function (e) {
    if (!dragging || committed) return;
    var dy = startY - e.clientY; /* 向上拖为正 */
    if (!moved && Math.abs(dy) > CFG.dragSlop) {
      moved = true;
      /* 确认是拖拽后再捕获指针：否则 click 会被重定向到 zone，按钮点不动 */
      try {
        zone.setPointerCapture(e.pointerId);
      } catch (err) {
        /* 老浏览器没有 pointer capture */
      }
    }
    setPull(dy > 0 ? dy : 0);
  });

  zone.addEventListener("pointerup", function () {
    release(true);
  });

  zone.addEventListener("pointercancel", function () {
    release(false);
  });

  zone.addEventListener(
    "click",
    function (e) {
      if (suppressClick) {
        suppressClick = false;
        e.preventDefault();
        e.stopPropagation();
        reset();
        return;
      }
      if (committed) e.preventDefault();
    },
    true
  );

  /* ---------- 滚轮 ---------- */
  zone.addEventListener(
    "wheel",
    function (e) {
      if (committed || Date.now() < cooldownUntil) return;
      if (window.scrollY > 2) return; /* 已滚走就把滚动还给页面 */

      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= window.innerHeight;

      e.preventDefault();

      wheelAcc = Math.max(0, Math.min(CFG.maxPull, wheelAcc + d * CFG.wheelGain));
      setPull(wheelAcc);

      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(function () {
        if (committed) return;
        if (wheelAcc >= CFG.threshold) commit();
        else reset();
      }, CFG.wheelIdle);
    },
    { passive: false }
  );

  /* ---------- 键盘：Esc 取消当前拉动 ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && (pull > 0 || dragging)) {
      dragging = false;
      reset();
    }
  });

  /* ---------- 从 about 返回（bfcache）时复位 ---------- */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    committed = false;
    cooldownUntil = 0;
    dragging = false;
    reset();
    root.classList.remove("is-committing", "is-armed");
    onScroll();
  });
})();
