/**
 * ACU-TO front-end interactions.
 *
 * Vanilla JS only: theme toggle, mobile navigation, search overlay, reading
 * progress, table of contents, copy-link and back-to-top. Everything here
 * also works in the exported static bundle.
 */
(function () {
	'use strict';

	var data = window.acutoData || {};
	var i18n = data.i18n || {};
	var root = document.documentElement;
	var body = document.body;
	var storedThemeKey = 'acuto-theme';

	function qs(selector, context) {
		return (context || document).querySelector(selector);
	}

	function qsa(selector, context) {
		return Array.prototype.slice.call((context || document).querySelectorAll(selector));
	}

	function debounce(fn, wait) {
		var timer = null;
		return function () {
			var args = arguments;
			var self = this;
			window.clearTimeout(timer);
			timer = window.setTimeout(function () {
				fn.apply(self, args);
			}, wait);
		};
	}

	function prefersReducedMotion() {
		return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	/* ---------------------------------------------------------------------
	 * Theme toggle
	 * ------------------------------------------------------------------- */

	var themeToggle = qs('[data-acuto-theme-toggle]');
	var themeColor = qs('#acuto-theme-color');
	var systemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

	function currentTheme() {
		return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
	}

	function updateThemeUI() {
		var dark = currentTheme() === 'dark';

		if (themeColor) {
			themeColor.setAttribute('content', dark ? '#06110f' : '#ffffff');
		}

		if (themeToggle) {
			themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
			themeToggle.setAttribute('aria-label', dark ? (i18n.lightMode || '切换到浅色模式') : (i18n.darkMode || '切换到深色模式'));
			themeToggle.setAttribute('title', dark ? (i18n.lightMode || '切换到浅色模式') : (i18n.darkMode || '切换到深色模式'));
		}
	}

	function setTheme(theme, persist) {
		var next = theme === 'dark' ? 'dark' : 'light';
		root.setAttribute('data-theme', next);
		root.style.colorScheme = next;

		if (persist) {
			try {
				window.localStorage.setItem(storedThemeKey, next);
			} catch (error) {}
		}

		updateThemeUI();
	}

	if (themeToggle) {
		themeToggle.addEventListener('click', function () {
			setTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
		});
	}

	updateThemeUI();

	if (systemTheme && systemTheme.addEventListener && data.defaultMode === 'auto') {
		systemTheme.addEventListener('change', function (event) {
			var stored = null;

			try {
				stored = window.localStorage.getItem(storedThemeKey);
			} catch (error) {}

			if (!stored) {
				setTheme(event.matches ? 'dark' : 'light', false);
			}
		});
	}

	/* ---------------------------------------------------------------------
	 * Mobile navigation
	 * ------------------------------------------------------------------- */

	var menuToggle = qs('[data-acuto-menu-toggle]');
	var nav = qs('[data-acuto-nav]');

	function setMenu(open) {
		if (!menuToggle || !nav) {
			return;
		}

		nav.classList.toggle('is-open', open);
		menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		menuToggle.setAttribute('aria-label', open ? (i18n.menuClose || '关闭菜单') : (i18n.menuOpen || '打开菜单'));
	}

	if (menuToggle && nav) {
		menuToggle.addEventListener('click', function () {
			setMenu(!nav.classList.contains('is-open'));
		});

		nav.addEventListener('click', function (event) {
			if (event.target.closest('a')) {
				setMenu(false);
			}
		});
	}

	/* ---------------------------------------------------------------------
	 * Search overlay
	 * ------------------------------------------------------------------- */

	var search = qs('[data-acuto-search]');
	var searchInput = qs('[data-acuto-search-input]');
	var searchResults = qs('[data-acuto-search-results]');
	var searchHint = qs('[data-acuto-search-hint]');
	var searchPanel = qs('.acuto-search__panel');
	var searchOpeners = qsa('[data-acuto-search-toggle]');
	var searchClosers = qsa('[data-acuto-search-close]');
	var searchIndex = null;
	var searchController = null;
	var lastFocus = null;

	function setSearchHint(text) {
		if (searchHint) {
			searchHint.textContent = text;
		}
	}

	function clearSearchResults() {
		if (searchResults) {
			searchResults.innerHTML = '';
		}
	}

	function openSearch() {
		if (!search || !searchInput) {
			return;
		}

		if (!search.hidden) {
			searchInput.focus();
			return;
		}

		lastFocus = document.activeElement;
		search.hidden = false;
		body.classList.add('acuto-search-open');

		searchOpeners.forEach(function (button) {
			button.setAttribute('aria-expanded', 'true');
		});

		window.setTimeout(function () {
			searchInput.focus();
			searchInput.select();
		}, 30);
	}

	function closeSearch() {
		if (!search || search.hidden) {
			return;
		}

		search.hidden = true;
		body.classList.remove('acuto-search-open');
		clearSearchResults();

		if (searchController) {
			searchController.abort();
			searchController = null;
		}

		if (searchInput) {
			searchInput.value = '';
		}

		setSearchHint(i18n.searchHint || '输入关键词开始搜索');

		searchOpeners.forEach(function (button) {
			button.setAttribute('aria-expanded', 'false');
		});

		if (lastFocus && typeof lastFocus.focus === 'function') {
			lastFocus.focus();
		}
	}

	searchOpeners.forEach(function (button) {
		button.setAttribute('aria-expanded', 'false');
		button.addEventListener('click', openSearch);
	});

	searchClosers.forEach(function (button) {
		button.addEventListener('click', closeSearch);
	});

	document.addEventListener('keydown', function (event) {
		var target = event.target;
		var typing = target && (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT' ||
			target.isContentEditable
		);

		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			openSearch();
			return;
		}

		if (event.key === '/' && !typing && search && search.hidden) {
			event.preventDefault();
			openSearch();
			return;
		}

		if (event.key === 'Escape') {
			closeSearch();
			setMenu(false);
		}
	});

	if (search) {
		search.addEventListener('keydown', function (event) {
			if (event.key !== 'Tab' || !searchPanel) {
				return;
			}

			var focusable = qsa('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])', searchPanel).filter(function (element) {
				return element.offsetParent !== null;
			});

			if (!focusable.length) {
				return;
			}

			var first = focusable[0];
			var last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		});
	}

	function stripHtml(html) {
		var container = document.createElement('div');
		container.innerHTML = html || '';
		return (container.textContent || '').replace(/\s+/g, ' ').trim();
	}

	function formatDate(value) {
		if (!value) {
			return '';
		}

		var date = new Date(value);

		if (isNaN(date.getTime())) {
			return value;
		}

		try {
			return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
		} catch (error) {
			return value;
		}
	}

	function createResult(item) {
		var link = document.createElement('a');
		link.className = 'acuto-search__result';
		link.href = item.url || item.link || '#';

		var date = document.createElement('span');
		date.className = 'acuto-search__result-date';
		date.textContent = item.date || '';

		var title = document.createElement('span');
		title.className = 'acuto-search__result-title';
		title.textContent = item.title || '';

		var excerpt = document.createElement('p');
		excerpt.className = 'acuto-search__result-excerpt';
		excerpt.textContent = item.excerpt || '';

		link.appendChild(date);
		link.appendChild(title);
		link.appendChild(excerpt);

		return link;
	}

	function renderSearchResults(items, query) {
		if (!searchResults) {
			return;
		}

		searchResults.innerHTML = '';

		if (!items.length) {
			var empty = document.createElement('p');
			empty.className = 'acuto-search__state';
			empty.textContent = i18n.searchEmpty || '没有找到匹配的内容。';
			searchResults.appendChild(empty);
			setSearchHint('“' + query + '” · 0');
			return;
		}

		items.forEach(function (item) {
			searchResults.appendChild(createResult(item));
		});

		setSearchHint('“' + query + '” · ' + items.length);
	}

	function loadStaticIndex() {
		if (searchIndex) {
			return Promise.resolve(searchIndex);
		}

		var home = data.homeUrl || data.searchIndexUrl || '/';
		var basePath = '/';

		try {
			basePath = new URL(home, window.location.href).pathname;
		} catch (error) {
			basePath = '/';
		}

		var url = basePath.replace(/\/?$/, '/') + 'search-index.json';

		return fetch(url, { headers: { Accept: 'application/json' } }).then(function (response) {
			if (!response.ok) {
				throw new Error('Search index ' + response.status);
			}

			return response.json().then(function (json) {
				searchIndex = Array.isArray(json) ? json : [];
				return searchIndex;
			});
		});
	}

	function searchStatic(query) {
		return loadStaticIndex().then(function (index) {
			var needle = query.toLowerCase();

			return index.filter(function (item) {
				var haystack = [item.title, item.excerpt, item.content, item.category, item.date].join(' ').toLowerCase();
				return haystack.indexOf(needle) !== -1;
			}).slice(0, 10);
		});
	}

	function searchLive(query, signal) {
		var base = data.restUrl || '/wp-json/wp/v2/';
		var url = base.replace(/\/?$/, '/') + 'posts';
		var endpoint = new URL(url, window.location.origin);
		endpoint.searchParams.set('search', query);
		endpoint.searchParams.set('per_page', '10');
		endpoint.searchParams.set('_embed', '1');

		return fetch(endpoint.toString(), { signal: signal, headers: { Accept: 'application/json' } }).then(function (response) {
			if (!response.ok) {
				throw new Error('Search ' + response.status);
			}

			return response.json().then(function (posts) {
				return posts.map(function (post) {
					var terms = post._embedded && post._embedded['wp:term'] ? post._embedded['wp:term'] : [];
					var category = '';

					if (terms.length && terms[0] && terms[0][0]) {
						category = terms[0][0].name || '';
					}

					return {
						title: stripHtml(post.title && post.title.rendered ? post.title.rendered : ''),
						url: post.link || '',
						excerpt: stripHtml(post.excerpt && post.excerpt.rendered ? post.excerpt.rendered : ''),
						category: category,
						date: formatDate(post.date || ''),
					};
				});
			});
		});
	}

	var searchSequence = 0;

	var runSearch = debounce(function (query) {
		if (!searchResults) {
			return;
		}

		if (!query) {
			searchSequence += 1;
			clearSearchResults();
			setSearchHint(i18n.searchHint || '输入关键词开始搜索');
			return;
		}

		if (searchController) {
			searchController.abort();
		}

		searchController = window.AbortController ? new AbortController() : null;
		var sequence = ++searchSequence;

		if (searchController) {
			searchResults.innerHTML = '<p class="acuto-search__state">' + (i18n.searchLoading || '正在搜索…') + '</p>';
		}

		var request = data.mode === 'static'
			? searchStatic(query)
			: searchLive(query, searchController ? searchController.signal : undefined);

		request.then(function (items) {
			if (sequence !== searchSequence) {
				return;
			}

			renderSearchResults(items, query);
		}).catch(function (error) {
			if (error && error.name === 'AbortError') {
				return;
			}

			if (sequence !== searchSequence) {
				return;
			}

			clearSearchResults();
			var message = document.createElement('p');
			message.className = 'acuto-search__state';
			message.textContent = i18n.searchError || '搜索暂时不可用，请稍后再试。';
			searchResults.appendChild(message);
			setSearchHint('');
		});
	}, 260);

	if (searchInput) {
		searchInput.addEventListener('input', function () {
			runSearch(searchInput.value.trim());
		});
	}

	/* ---------------------------------------------------------------------
	 * Sticky header, reading progress and TOC active state
	 * ------------------------------------------------------------------- */

	var header = qs('[data-acuto-header]');
	var progressBar = qs('[data-acuto-progress] span');
	var article = qs('.acuto-single');
	var toc = qs('[data-acuto-toc]');
	var tocItems = [];
	var ticking = false;
	var headerCollapsed = false;
	var headerCollapseAt = 160;
	var headerExpandAt = 96;

	/*
	 * Two thresholds instead of one: collapsing the top bar changes the height
	 * of a sticky element that is still in flow, so a single threshold gets
	 * crossed again by the resulting layout shift and the header flickers.
	 */
	function syncHeader() {
		if (!header) {
			return;
		}

		var offset = window.scrollY || window.pageYOffset || 0;

		if (!headerCollapsed && offset > headerCollapseAt) {
			headerCollapsed = true;
			header.classList.add('is-stuck');
		} else if (headerCollapsed && offset < headerExpandAt) {
			headerCollapsed = false;
			header.classList.remove('is-stuck');
		}
	}

	function updateProgress() {
		if (!progressBar || !article) {
			return;
		}

		var rect = article.getBoundingClientRect();
		var total = article.offsetHeight - window.innerHeight;

		if (total <= 0) {
			progressBar.style.width = '0%';
			return;
		}

		var scrolled = Math.min(Math.max(-rect.top, 0), total);
		progressBar.style.width = ((scrolled / total) * 100).toFixed(3) + '%';
	}

	function updateActiveHeading() {
		if (!tocItems.length) {
			return;
		}

		var threshold = 150;
		var active = null;

		tocItems.forEach(function (item) {
			var heading = item.heading;

			if (heading.getBoundingClientRect().top <= threshold) {
				active = item;
			}
		});

		tocItems.forEach(function (item) {
			item.link.parentNode.classList.toggle('is-active', active === item);
		});
	}

	function onScroll() {
		if (ticking) {
			return;
		}

		ticking = true;
		window.requestAnimationFrame(function () {
			syncHeader();

			updateProgress();
			updateActiveHeading();
			ticking = false;
		});
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll);

	/* ---------------------------------------------------------------------
	 * Table of contents and drop cap
	 * ------------------------------------------------------------------- */

	function slugify(text) {
		var slug = text.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');

		if (!slug) {
			slug = 'section';
		}

		return slug.slice(0, 64);
	}

	var prose = qs('[data-acuto-prose]');

	if (prose) {
		var firstParagraph = prose.querySelector(':scope > p');

		if (firstParagraph && firstParagraph.textContent.trim().length > 90) {
			prose.classList.add('acuto-has-dropcap');
		}
	}

	if (toc && prose) {
		var headings = qsa('h2, h3', prose).filter(function (heading) {
			return heading.textContent.trim().length > 0;
		});

		if (headings.length >= 3) {
			var list = qs('[data-acuto-toc-list]', toc);
			var used = {};

			headings.forEach(function (heading) {
				var base = heading.id || slugify(heading.textContent);
				var id = base;
				var count = 1;

				while (used[id]) {
					id = base + '-' + count;
					count += 1;
				}

				used[id] = true;
				heading.id = id;

				var item = document.createElement('li');
				item.className = 'acuto-toc__item acuto-toc__item--' + heading.tagName.toLowerCase();

				var link = document.createElement('a');
				link.href = '#' + id;
				link.textContent = heading.textContent.trim();

				item.appendChild(link);

				if (list) {
					list.appendChild(item);
				}

				tocItems.push({ heading: heading, link: link });
			});

			toc.hidden = false;
			updateActiveHeading();

			toc.addEventListener('click', function (event) {
				var link = event.target.closest('a[href^="#"]');

				if (!link) {
					return;
				}

				var target = document.getElementById(link.getAttribute('href').slice(1));

				if (!target) {
					return;
				}

				event.preventDefault();
				var offset = target.getBoundingClientRect().top + window.scrollY - 130;
				window.scrollTo({ top: offset, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

				if (window.history && window.history.pushState) {
					window.history.pushState(null, '', link.getAttribute('href'));
				}
			});
		}
	}

	var tocToggle = qs('[data-acuto-toc-toggle]');

	if (tocToggle && toc) {
		tocToggle.addEventListener('click', function () {
			var collapsed = toc.classList.toggle('is-collapsed');
			tocToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
			tocToggle.textContent = collapsed ? '展开' : '收起';
		});
	}

	/* ---------------------------------------------------------------------
	 * Copy link
	 * ------------------------------------------------------------------- */

	function copyText(text) {
		if (navigator.clipboard && window.isSecureContext) {
			return navigator.clipboard.writeText(text);
		}

		return new Promise(function (resolve, reject) {
			var textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.setAttribute('readonly', 'readonly');
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();

			try {
				var ok = document.execCommand('copy');
				document.body.removeChild(textarea);

				if (ok) {
					resolve();
				} else {
					reject(new Error('Copy failed'));
				}
			} catch (error) {
				document.body.removeChild(textarea);
				reject(error);
			}
		});
	}

	qsa('[data-acuto-copy-link]').forEach(function (button) {
		button.addEventListener('click', function () {
			copyText(window.location.href).then(function () {
				var label = button.querySelector('.acuto-share__text');
				var original = label ? label.textContent : '';

				button.classList.add('is-copied');

				if (label) {
					label.textContent = i18n.copied || '已复制';
				}

				window.setTimeout(function () {
					button.classList.remove('is-copied');

					if (label) {
						label.textContent = original;
					}
				}, 1800);
			}).catch(function () {
				window.prompt('复制链接', window.location.href);
			});
		});
	});

	/* ---------------------------------------------------------------------
	 * Back to top
	 * ------------------------------------------------------------------- */

	var topButton = qs('[data-acuto-top]');

	if (topButton) {
		topButton.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
		});
	}

	/* ---------------------------------------------------------------------
	 * Close the mobile menu if the viewport grows
	 * ------------------------------------------------------------------- */

	window.addEventListener('resize', function () {
		if (window.innerWidth > 900) {
			setMenu(false);
		}
	});

	onScroll();
})();
