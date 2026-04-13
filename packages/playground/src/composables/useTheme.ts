import { ref } from 'vue';

export type Theme = 'default' | 'tailwind' | 'bootstrap' | 'minimal';

const activeTheme = ref<Theme>('default');
let bootstrapLoaded = false;
let minimalLoaded = false;

export function useTheme() {
  function setTheme(theme: Theme): void {
    if (theme === 'bootstrap' && !bootstrapLoaded) {
      const link = document.createElement('link');
      link.id = 'bs-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
      document.head.appendChild(link);
      bootstrapLoaded = true;
    }
    if (theme === 'minimal' && !minimalLoaded) {
      void import('@ioi-dev/vue-table/minimal.css');
      minimalLoaded = true;
    }
    activeTheme.value = theme;
  }

  return { activeTheme, setTheme };
}
