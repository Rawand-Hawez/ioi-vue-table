import { ref } from 'vue';

export type Theme = 'default' | 'tailwind' | 'bootstrap' | 'minimal';

const activeTheme = ref<Theme>('default');

export function useTheme() {
  function setTheme(theme: Theme): void {
    const prevTheme = activeTheme.value;
    activeTheme.value = theme;

    if (prevTheme === 'bootstrap') {
      const link = document.getElementById('bs-css') as HTMLLinkElement | null;
      if (link) link.disabled = true;
    }

    if (theme === 'bootstrap') {
      let link = document.getElementById('bs-css') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.id = 'bs-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
        document.head.appendChild(link);
      } else {
        link.disabled = false;
      }
    }

    if (theme === 'minimal') {
      void import('@ioi-dev/vue-table/minimal.css');
    }
  }

  return { activeTheme, setTheme };
}
