
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Header.svelte generated by Svelte v3.59.2 */

    const file$2 = "src\\Header.svelte";

    function create_fragment$2(ctx) {
    	let header;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let svg;
    	let defs;
    	let g0;
    	let path0;
    	let g1;
    	let path1;
    	let g2;
    	let path2;
    	let t4;
    	let span3;
    	let t6;
    	let span4;

    	const block = {
    		c: function create() {
    			header = element("header");
    			span0 = element("span");
    			span0.textContent = "About me";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Projects";
    			t3 = space();
    			span2 = element("span");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			g1 = svg_element("g");
    			path1 = svg_element("path");
    			g2 = svg_element("g");
    			path2 = svg_element("path");
    			t4 = space();
    			span3 = element("span");
    			span3.textContent = "Certificates";
    			t6 = space();
    			span4 = element("span");
    			span4.textContent = "Language";
    			add_location(span0, file$2, 3, 2, 33);
    			add_location(span1, file$2, 4, 2, 58);
    			attr_dev(defs, "id", "SvgjsDefs6312");
    			add_location(defs, file$2, 10, 82, 13952);
    			attr_dev(path0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(path0, "d", "M0 0h100v100H0z");
    			add_location(path0, file$2, 10, 235, 14105);
    			attr_dev(g0, "id", "SvgjsG6313");
    			attr_dev(g0, "featurekey", "rootContainer");
    			attr_dev(g0, "transform", "matrix(1.1025,0,0,1.1025,0,-9)");
    			attr_dev(g0, "fill", "#000000");
    			attr_dev(g0, "fill-opacity", "0");
    			add_location(g0, file$2, 10, 114, 13984);
    			attr_dev(path1, "d", "M10.547 13.3594 l-1.4844 6.6797 l-4.9512 0 l1.5234 -6.6797 l-0.88867 0 l0.98633 -4.2773 l-3.9063 0 l0.85938 -3.7012 l12.676 0 l-0.83008 3.7012 l-3.8965 0 l-0.95703 4.2773 l0.86914 0 z M13.935503125 13.789100000000001 l-1.0352 0 c0.58594 -3.3789 3.2227 -6.9629 6.3477 -8.0469 c3.2129 -1.123 5.8691 -0.57617 8.6816 0.94727 l-0.9375 4.0332 l-1.543 0 c-0.22461 -0.54688 -0.078125 -1.6211 -2.3438 -1.8164 c-3.2227 -0.2832 -5.3418 2.5391 -5.7227 4.8828 l1.0352 0 c-0.19531 1.2207 0.068359 2.3242 0.89844 2.7734 c0.54688 0.29297 1.3379 0.42969 2.5098 0.29297 l0.019531 0 l0.36133 -1.582 l-2.3242 0 l0.3418 -1.4844 l-1.0547 0 l0.50781 -2.1875 l7.168 0 l-0.49805 2.1875 l1.0449 0 l-1.2402 5.3809 c-0.49805 0.20508 -1.0156 0.37109 -1.5332 0.54688 c-2.3242 0.71289 -5.3027 1.1914 -7.6172 0.26367 c-2.7441 -1.0742 -3.5156 -3.5742 -3.0664 -6.1914 z");
    			add_location(path1, file$2, 10, 461, 14331);
    			attr_dev(g1, "id", "SvgjsG6314");
    			attr_dev(g1, "featurekey", "U6MYgK-0");
    			attr_dev(g1, "transform", "matrix(3.8309122456235776,0,0,3.8309122456235776,-1.9958585305181558,-9.714593793444)");
    			attr_dev(g1, "fill", "#f2f4f7");
    			add_location(g1, file$2, 10, 307, 14177);
    			attr_dev(path2, "d", "M10.547 13.3594 l-1.4844 6.6797 l-4.9512 0 l1.5234 -6.6797 l-0.88867 0 l0.98633 -4.2773 l-3.9063 0 l0.85938 -3.7012 l12.676 0 l-0.83008 3.7012 l-3.8965 0 l-0.95703 4.2773 l0.86914 0 z M28.430582031249997 12.8418 c-0.078125 0.3125 -0.16602 0.625 -0.2832 0.94727 l1.0645 0 c-1.2402 3.877 -4.3945 6.6895 -8.7207 6.6895 c-4.4629 0 -6.2012 -2.8125 -5.6348 -6.6895 l-1.0352 0 c0.039063 -0.32227 0.087891 -0.63477 0.15625 -0.94727 c1.0352 -4.4629 4.2676 -7.6563 8.9648 -7.6563 c4.5996 0 6.4941 3.2227 5.4883 7.6563 z M24.14258203125 13.789100000000001 l-1.0547 0 c0.097656 -0.32227 0.19531 -0.63477 0.26367 -0.9668 c1.2402 -5.3613 -3.0859 -5.2051 -4.2969 0.019531 c-0.068359 0.3418 -0.11719 0.6543 -0.16602 0.94727 l1.0547 0 c-0.50781 4.082 2.8223 3.9941 4.1992 0 z M42.7975390625 15.332 c-0.53711 2.207 -2.3926 3.8086 -4.5508 4.4238 c-0.68359 0.17578 -1.5332 0.24414 -2.5684 0.24414 l-6.0156 0 l1.4648 -6.3672 l-1.1133 0 l1.9043 -8.2031 c1.6895 0 6.8164 -0.32227 8.5449 0.3125 c1.4648 0.57617 2.1582 1.7871 1.7969 3.3691 c-0.27344 1.1816 -0.98633 2.0996 -1.9434 2.8125 c0.80078 0.40039 1.2695 1.0059 1.4258 1.709 l1.0742 0 c0.12695 0.54688 0.097656 1.0742 -0.019531 1.6992 z M37.7978390625 15.273399999999999 c0.3125 -1.3574 -1.0254 -1.0938 -1.9043 -1.0938 l-0.52734 2.2559 c1.084 0 2.1484 0.12695 2.4316 -1.1621 z M37.2119390625 10 c0.22461 -0.9082 -0.52734 -1.0156 -1.2402 -1.0156 l-0.37109 1.7676 c0.54688 0.048828 1.4648 -0.029297 1.6113 -0.75195 z M49.84131796875 13.6719 l-1.4648 6.3672 l-4.9414 0 l1.4648 -6.3672 l-0.99609 0 l1.9141 -8.2422 l4.9316 0 l-1.8945 8.2422 l0.98633 0 z M53.310515625 13.6328 l-1.123 0 l4.5898 -8.1934 l4.873 0 l0.79102 8.1934 l1.0938 0 l0.61523 6.3574 l-5.0293 0 l-0.20508 -2.7441 l-2.7832 0 c-0.48828 0.9082 -0.94727 1.8262 -1.4355 2.7441 l-4.9414 0 z M58.789015625 13.837900000000001 l0 -0.20508 l-1.0645 0 l0.019531 -3.2422 l-1.3086 3.2422 l1.084 0 l-0.078125 0.20508 l1.3477 0 z M77.70759765625 13.3594 c0.56641 2.0508 -1.1328 4.4727 -2.7051 5.5371 c-3.0859 2.0215 -7.1582 1.6992 -10.313 0.078125 l0.91797 -4.0625 l1.5137 0 c0.19531 2.0996 4.8926 2.9688 5.3711 0.89844 c0.23438 -1.0254 -3.4473 -1.3086 -4.6777 -2.2754 c-0.068359 -0.058594 -0.14648 -0.11719 -0.20508 -0.17578 l-0.89844 0 c-0.97656 -0.91797 -1.0645 -2.1387 -0.78125 -3.4082 c1.1914 -5.2051 8.2617 -5.7227 12.344 -3.6621 l-0.9082 3.9551 l-1.5234 0 c0.097656 -1.4844 -4.3945 -2.5 -4.8145 -0.71289 c-0.2832 1.3867 4.2676 0.97656 5.5273 3.1738 c0.10742 0.19531 0.19531 0.42969 0.25391 0.6543 l0.89844 0 z M89.78267109375 13.789100000000001 l-1.0352 0 c0.58594 -3.3789 3.2227 -6.9629 6.3477 -8.0469 c3.2129 -1.123 5.8691 -0.57617 8.6816 0.94727 l-0.9375 4.0332 l-1.543 0 c-0.22461 -0.54688 -0.078125 -1.6211 -2.3438 -1.8164 c-3.2227 -0.2832 -5.3418 2.5391 -5.7227 4.8828 l1.0352 0 c-0.19531 1.2207 0.068359 2.3242 0.89844 2.7734 c0.54688 0.29297 1.3379 0.42969 2.5098 0.29297 l0.019531 0 l0.36133 -1.582 l-2.3242 0 l0.3418 -1.4844 l-1.0547 0 l0.50781 -2.1875 l7.168 0 l-0.49805 2.1875 l1.0449 0 l-1.2402 5.3809 c-0.49805 0.20508 -1.0156 0.37109 -1.5332 0.54688 c-2.3242 0.71289 -5.3027 1.1914 -7.6172 0.26367 c-2.7441 -1.0742 -3.5156 -3.5742 -3.0664 -6.1914 z M106.191375 13.6328 l-1.123 0 l4.5898 -8.1934 l4.873 0 l0.79102 8.1934 l1.0938 0 l0.61523 6.3574 l-5.0293 0 l-0.20508 -2.7441 l-2.7832 0 c-0.48828 0.9082 -0.94727 1.8262 -1.4355 2.7441 l-4.9414 0 z M111.669875 13.837900000000001 l0 -0.20508 l-1.0645 0 l0.019531 -3.2422 l-1.3086 3.2422 l1.084 0 l-0.078125 0.20508 l1.3477 0 z M122.71725703125 13.6328 l1.1133 0 c-0.17578 2.3535 1.4258 4.1211 5.9375 1.2207 l1.4648 0 l-0.91797 3.9844 c-4.9512 2.8516 -12.295 1.9922 -11.221 -5.2051 l-1.1035 0 c0.058594 -0.26367 0.11719 -0.57617 0.19531 -0.91797 c0.99609 -4.3652 4.3262 -7.5391 8.9648 -7.5391 c2.5586 0 4.0332 0.73242 4.9121 1.3379 l-0.94727 4.082 l-1.5723 0 c-3.5352 -3.8086 -6.5918 0.078125 -6.8262 3.0371 z M142.4466796875 13.6719 l2.832 6.3672 l-5.791 0 l-1.8359 -4.4043 l-1.0156 4.4043 l-4.9023 0 l1.4648 -6.3672 l-0.98633 0 l1.8848 -8.2422 l4.9121 0 l-0.94727 4.1016 c1.2793 -1.3672 2.5293 -2.7539 3.7988 -4.1016 l5.6445 0 l-6.6602 6.8359 l0.5957 1.4063 l1.0059 0 z M160.56437109375 12.8418 c-0.078125 0.3125 -0.16602 0.625 -0.2832 0.94727 l1.0645 0 c-1.2402 3.877 -4.3945 6.6895 -8.7207 6.6895 c-4.4629 0 -6.2012 -2.8125 -5.6348 -6.6895 l-1.0352 0 c0.039063 -0.32227 0.087891 -0.63477 0.15625 -0.94727 c1.0352 -4.4629 4.2676 -7.6563 8.9648 -7.6563 c4.5996 0 6.4941 3.2227 5.4883 7.6563 z M156.27637109375002 13.789100000000001 l-1.0547 0 c0.097656 -0.32227 0.19531 -0.63477 0.26367 -0.9668 c1.2402 -5.3613 -3.0859 -5.2051 -4.2969 0.019531 c-0.068359 0.3418 -0.11719 0.6543 -0.16602 0.94727 l1.0547 0 c-0.50781 4.082 2.8223 3.9941 4.1992 0 z");
    			add_location(path2, file$2, 10, 1473, 15343);
    			attr_dev(g2, "id", "SvgjsG6315");
    			attr_dev(g2, "featurekey", "Nr57KM-0");
    			attr_dev(g2, "transform", "matrix(0.5015060351888716,0,0,0.5015060351888716,14.084169761813138,80.41915576896753)");
    			attr_dev(g2, "fill", "#f2f4f7");
    			add_location(g2, file$2, 10, 1318, 15188);
    			attr_dev(svg, "width", "260");
    			attr_dev(svg, "height", "260");
    			attr_dev(svg, "viewBox", "0 -9 110.25 119.25");
    			attr_dev(svg, "class", "css-1j8o68f svelte-jyi2fr");
    			add_location(svg, file$2, 10, 3, 13873);
    			attr_dev(span2, "id", "icon");
    			attr_dev(span2, "class", "svelte-jyi2fr");
    			add_location(span2, file$2, 5, 2, 83);
    			add_location(span3, file$2, 12, 2, 20083);
    			add_location(span4, file$2, 13, 2, 20112);
    			attr_dev(header, "class", "svelte-jyi2fr");
    			add_location(header, file$2, 2, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, span0);
    			append_dev(header, t1);
    			append_dev(header, span1);
    			append_dev(header, t3);
    			append_dev(header, span2);
    			append_dev(span2, svg);
    			append_dev(svg, defs);
    			append_dev(svg, g0);
    			append_dev(g0, path0);
    			append_dev(svg, g1);
    			append_dev(g1, path1);
    			append_dev(svg, g2);
    			append_dev(g2, path2);
    			append_dev(header, t4);
    			append_dev(header, span3);
    			append_dev(header, t6);
    			append_dev(header, span4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Footer.svelte generated by Svelte v3.59.2 */

    const file$1 = "src\\Footer.svelte";

    function create_fragment$1(ctx) {
    	let footer;
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Fabebook";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Github";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "LinkedId";
    			add_location(li0, file$1, 4, 4, 43);
    			add_location(li1, file$1, 5, 4, 66);
    			add_location(li2, file$1, 6, 4, 87);
    			add_location(ul, file$1, 3, 2, 33);
    			add_location(footer, file$1, 2, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    // (28:36) 
    function create_if_block_1(ctx) {
    	let h2;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Über mir";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Ich bin am 28.11.1997 in Bratislava geboren worden. Ich wohnte einige Jahre in Nairobi, Kenia. Dann habe ich das\r\n        Land für Dubai, UAE verlassen. Nach einer langen Zeit im Ausland, kehrte ich schließlich wieder zurück, wo ich\r\n        mich allerdings nicht zu lange aufenthielt, da ich wieder ausgereist bin, diesmal nach Straßburg in Frankreich.\r\n        Lange Rede, kurzer Sinn, ich habe im Leben viel herumgereist.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Daraufhin habe ich mich entschieden an der Technischen Universität Wien zu studieren.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "Ich sammelte Praxiserfahrung bei Bosch als Java Entwickler.";
    			add_location(h2, file, 28, 6, 1053);
    			add_location(p0, file, 29, 6, 1078);
    			add_location(p1, file, 35, 6, 1534);
    			add_location(p2, file, 36, 6, 1634);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(28:36) ",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#if language === 'english'}
    function create_if_block(ctx) {
    	let h2;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "About me";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "I was born on 28.11.1997 in Bratislava. I lived a few years in Nairobi, Kenya. Then I left for Dubai, UAE.\r\n        After a lengthy spell in abroad, i alas returned to Slovakia, which though ever did not last long, as I then\r\n        ended up moving again to Strassbourg, France. Long story short, lots of moving.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "I then decided to study informatics at the University of Technology, Vienna.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "I collected job experience at Bosch as a Java Software Engineer.";
    			add_location(h2, file, 19, 6, 474);
    			add_location(p0, file, 20, 6, 499);
    			add_location(p1, file, 25, 6, 845);
    			add_location(p2, file, 26, 6, 936);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(19:4) {#if language === 'english'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let t0;
    	let main;
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let p;
    	let t5;
    	let a;
    	let t7;
    	let t8;
    	let article;
    	let div;
    	let t9;
    	let img0;
    	let img0_src_value;
    	let t10;
    	let img1;
    	let img1_src_value;
    	let t11;
    	let footer;
    	let current;
    	let mounted;
    	let dispose;
    	header = new Header({ $$inline: true });

    	function select_block_type(ctx, dirty) {
    		if (/*language*/ ctx[0] === 'english') return create_if_block;
    		if (/*language*/ ctx[0] === 'german') return create_if_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			t1 = text("Hello ");
    			t2 = text(/*name*/ ctx[1]);
    			t3 = text("!");
    			t4 = space();
    			p = element("p");
    			t5 = text("Visit the ");
    			a = element("a");
    			a.textContent = "Svelte tutorial";
    			t7 = text(" to learn how to build Svelte apps.");
    			t8 = space();
    			article = element("article");
    			div = element("div");
    			if (if_block) if_block.c();
    			t9 = space();
    			img0 = element("img");
    			t10 = space();
    			img1 = element("img");
    			t11 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(h1, "class", "svelte-9igxuw");
    			add_location(h1, file, 14, 1, 260);
    			attr_dev(a, "href", "https://svelte.dev/tutorial");
    			add_location(a, file, 15, 14, 298);
    			add_location(p, file, 15, 1, 285);
    			attr_dev(div, "id", "about-me");
    			attr_dev(div, "class", "svelte-9igxuw");
    			add_location(div, file, 17, 4, 413);
    			if (!src_url_equal(img0.src, img0_src_value = "resources/united-kingdom-flag-icon.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "United Kingdom flag");
    			attr_dev(img0, "class", "flag-icon svelte-9igxuw");
    			add_location(img0, file, 39, 4, 1729);
    			if (!src_url_equal(img1.src, img1_src_value = "resources/germany-flag-icon.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "German flag");
    			attr_dev(img1, "class", "flag-icon svelte-9igxuw");
    			add_location(img1, file, 40, 4, 1873);
    			add_location(article, file, 16, 2, 398);
    			attr_dev(main, "class", "svelte-9igxuw");
    			add_location(main, file, 13, 0, 251);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(main, t4);
    			append_dev(main, p);
    			append_dev(p, t5);
    			append_dev(p, a);
    			append_dev(p, t7);
    			append_dev(main, t8);
    			append_dev(main, article);
    			append_dev(article, div);
    			if (if_block) if_block.m(div, null);
    			append_dev(article, t9);
    			append_dev(article, img0);
    			append_dev(article, t10);
    			append_dev(article, img1);
    			insert_dev(target, t11, anchor);
    			mount_component(footer, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", /*click_handler*/ ctx[3], false, false, false, false),
    					listen_dev(img1, "click", /*click_handler_1*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 2) set_data_dev(t2, /*name*/ ctx[1]);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);

    			if (if_block) {
    				if_block.d();
    			}

    			if (detaching) detach_dev(t11);
    			destroy_component(footer, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let { language } = $$props;

    	function switchLanguage(newLanguage) {
    		$$invalidate(0, language = newLanguage);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (name === undefined && !('name' in $$props || $$self.$$.bound[$$self.$$.props['name']])) {
    			console.warn("<App> was created without expected prop 'name'");
    		}

    		if (language === undefined && !('language' in $$props || $$self.$$.bound[$$self.$$.props['language']])) {
    			console.warn("<App> was created without expected prop 'language'");
    		}
    	});

    	const writable_props = ['name', 'language'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => switchLanguage('english');
    	const click_handler_1 = () => switchLanguage('german');

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('language' in $$props) $$invalidate(0, language = $$props.language);
    	};

    	$$self.$capture_state = () => ({
    		Header,
    		Footer,
    		name,
    		language,
    		switchLanguage
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('language' in $$props) $$invalidate(0, language = $$props.language);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [language, name, switchLanguage, click_handler, click_handler_1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 1, language: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get language() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set language(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world',
            language: 'english'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
