import { ref } from 'vue';

export type Theme = 'default' | 'tailwind' | 'bootstrap';

const activeTheme = ref<Theme>('default');
let bootstrapLoaded = false;

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
    activeTheme.value = theme;
  }

  return { activeTheme, setTheme };
}
