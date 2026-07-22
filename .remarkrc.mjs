import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";

const config = {
  settings: {
    bullet: "-",
  },
  plugins: [[remarkMdx, { printWidth: 120 }], remarkGfm],
};

export default config;
