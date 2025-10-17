import vueLogoUrl from './assets/vue.svg';
import RemotePreview from './pages/RemotePreview.vue';
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
// CSS variable injection
// CSS variable injection end
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({});
__VLS_asFunctionalElement(
  __VLS_elements.a,
  __VLS_elements.a,
)({
  href: 'https://vite.dev',
  target: '_blank',
});
__VLS_asFunctionalElement(__VLS_elements.img)({
  src: '/vite.svg',
  ...{ class: 'logo' },
  alt: 'Vite logo',
});
__VLS_asFunctionalElement(
  __VLS_elements.a,
  __VLS_elements.a,
)({
  href: 'https://vuejs.org/',
  target: '_blank',
});
__VLS_asFunctionalElement(__VLS_elements.img)({
  src: __VLS_ctx.vueLogoUrl,
  ...{ class: 'logo vue' },
  alt: 'Vue logo',
});
// @ts-ignore
[vueLogoUrl];
/** @type {[typeof RemotePreview, ]} */ // @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(RemotePreview, new RemotePreview({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {__VLS_StyleScopedClasses['logo']} */ /** @type {__VLS_StyleScopedClasses['logo']} */ /** @type {__VLS_StyleScopedClasses['vue']} */ var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
  setup: () => ({
    vueLogoUrl: vueLogoUrl,
    RemotePreview: RemotePreview,
  }),
});
export default (await import('vue')).defineComponent({}); /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=App.vue.js.map
