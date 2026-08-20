// PostCSS config for Tailwind CSS
// Uses ESM syntax (package.json has "type": "module")
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: {
    tailwindcss,
    autoprefixer,
  },
};
