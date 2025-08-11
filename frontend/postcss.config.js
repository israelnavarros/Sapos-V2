import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [
    tailwindcss({
      config: './tailwind.config.js', // ou .js se você voltar
    }),
    autoprefixer(),
  ],
}
